import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decomposeSpec } from '@/lib/forge';
import type { TechStack, Workstream } from '@/lib/forge';
import type { Prisma } from '@prisma/client';

// POST /api/forge/builds - Create and start a new build
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    const body = await request.json();
    const { spec, techStack, repoPath, projectId } = body as {
      spec: string;
      techStack?: Partial<TechStack>;
      repoPath?: string;
      projectId?: string;
    };

    if (!spec || spec.trim().length < 10) {
      return NextResponse.json(
        { error: 'Spec must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Create the build record
    const build = await prisma.forgeBuild.create({
      data: {
        userId,
        projectId,
        spec: spec.trim(),
        techStackJson: techStack || {},
        repoPath,
        status: 'DECOMPOSING',
      },
    });

    // Start decomposition in background (non-blocking)
    startDecomposition(build.id, spec, techStack).catch(console.error);

    return NextResponse.json({
      buildId: build.id,
      status: 'DECOMPOSING',
      streamUrl: `/api/forge/builds/${build.id}/stream`,
    });
  } catch (error) {
    console.error('Failed to create build:', error);
    return NextResponse.json(
      { error: 'Failed to create build' },
      { status: 500 }
    );
  }
}

// GET /api/forge/builds - List builds
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const builds = await prisma.forgeBuild.findMany({
      where: {
        ...(session?.user?.id ? { userId: session.user.id } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            workstreams: true,
            questions: true,
          },
        },
      },
    });

    return NextResponse.json({
      builds: builds.map((b) => ({
        id: b.id,
        spec: b.spec.slice(0, 200) + (b.spec.length > 200 ? '...' : ''),
        status: b.status,
        currentWave: b.currentWave,
        totalWaves: b.totalWaves,
        prUrl: b.prUrl,
        workstreamCount: b._count.workstreams,
        questionCount: b._count.questions,
        createdAt: b.createdAt,
        completedAt: b.completedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to list builds:', error);
    return NextResponse.json(
      { error: 'Failed to list builds' },
      { status: 500 }
    );
  }
}

// Background decomposition
async function startDecomposition(
  buildId: string,
  spec: string,
  techStack?: Partial<TechStack>
) {
  const { broadcastBuildUpdate } = await import(
    './[buildId]/stream/route'
  );

  try {
    // Decompose the spec
    const decomposed = await decomposeSpec(spec, techStack);

    // Calculate waves
    const waves = decomposed.executionWaves;
    const totalWaves = waves.length;

    // Update build with decomposition
    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: {
        decomposedJson: decomposed as unknown as Prisma.InputJsonValue,
        totalWaves,
        status: 'EXECUTING',
      },
    });

    // Create workstream records
    const workstreamRecords = decomposed.workstreams.map((ws: Workstream) => ({
      buildId,
      workstreamKey: ws.id,
      name: ws.name,
      agent: ws.agent,
      wave: waves.findIndex((w) => w.includes(ws.id)) + 1,
      priority: ws.priority,
      ownsFiles: ws.owns,
      producesFiles: ws.produces,
      blockedBy: ws.blockedBy,
      prompt: ws.prompt,
      status: 'PENDING' as const,
    }));

    await prisma.forgeWorkstream.createMany({
      data: workstreamRecords,
    });

    // Fetch created workstreams
    const workstreams = await prisma.forgeWorkstream.findMany({
      where: { buildId },
    });

    // Broadcast decomposition complete
    broadcastBuildUpdate(buildId, 'decomposed', {
      totalWaves,
      workstreams: workstreams.map((ws) => ({
        id: ws.id,
        workstreamKey: ws.workstreamKey,
        name: ws.name,
        agent: ws.agent,
        wave: ws.wave,
        status: ws.status,
      })),
    });

    // Start execution
    await executeWaves(buildId);
  } catch (error) {
    console.error('Decomposition failed:', error);
    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: {
        status: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Decomposition failed',
      },
    });
    broadcastBuildUpdate(buildId, 'error', {
      message: error instanceof Error ? error.message : 'Decomposition failed',
    });
  }
}

// Execute waves sequentially
async function executeWaves(buildId: string) {
  const { broadcastBuildUpdate } = await import(
    './[buildId]/stream/route'
  );

  const build = await prisma.forgeBuild.findUnique({
    where: { id: buildId },
    include: { workstreams: true },
  });

  if (!build) return;

  const totalWaves = build.totalWaves;

  for (let wave = 1; wave <= totalWaves; wave++) {
    // Update current wave
    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: { currentWave: wave },
    });

    broadcastBuildUpdate(buildId, 'wave_start', { wave, totalWaves });

    // Get workstreams for this wave
    const waveWorkstreams = build.workstreams.filter((ws) => ws.wave === wave);

    // Execute all workstreams in this wave in parallel
    await Promise.all(
      waveWorkstreams.map((ws) => executeWorkstream(buildId, ws.id))
    );

    // Check if any failed
    const updatedWorkstreams = await prisma.forgeWorkstream.findMany({
      where: { buildId, wave },
    });

    const anyFailed = updatedWorkstreams.some((ws) => ws.status === 'FAILED');
    if (anyFailed) {
      await prisma.forgeBuild.update({
        where: { id: buildId },
        data: {
          status: 'FAILED',
          errorMessage: 'One or more workstreams failed',
        },
      });
      broadcastBuildUpdate(buildId, 'build_failed', {
        wave,
        message: 'Workstream failure',
      });
      return;
    }

    broadcastBuildUpdate(buildId, 'wave_complete', { wave, totalWaves });
  }

  // All waves complete - start merging
  await startMerging(buildId);
}

// Execute a single workstream (mock for now)
async function executeWorkstream(buildId: string, workstreamId: string) {
  const { broadcastBuildUpdate } = await import(
    './[buildId]/stream/route'
  );

  // Mark as running
  await prisma.forgeWorkstream.update({
    where: { id: workstreamId },
    data: { status: 'RUNNING' },
  });

  const ws = await prisma.forgeWorkstream.findUnique({
    where: { id: workstreamId },
  });

  broadcastBuildUpdate(buildId, 'workstream_start', {
    workstreamId,
    workstreamKey: ws?.workstreamKey,
    agent: ws?.agent,
  });

  try {
    // TODO: Replace with actual agent spawning
    // For now, simulate work with a delay
    const mockDuration = 2000 + Math.random() * 3000;
    await new Promise((resolve) => setTimeout(resolve, mockDuration));

    // Simulate output
    const mockOutput = `[Mock Agent] Completed workstream: ${ws?.name}\n` +
      `Files created: ${ws?.producesFiles?.join(', ') || 'none'}\n` +
      `Duration: ${Math.round(mockDuration)}ms`;

    // Mark as completed
    await prisma.forgeWorkstream.update({
      where: { id: workstreamId },
      data: {
        status: 'COMPLETED',
        output: mockOutput,
        durationMs: Math.round(mockDuration),
        filesCreated: ws?.producesFiles || [],
        completedAt: new Date(),
      },
    });

    broadcastBuildUpdate(buildId, 'workstream_complete', {
      workstreamId,
      workstreamKey: ws?.workstreamKey,
      output: mockOutput.slice(0, 200),
      durationMs: Math.round(mockDuration),
    });
  } catch (error) {
    await prisma.forgeWorkstream.update({
      where: { id: workstreamId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    broadcastBuildUpdate(buildId, 'workstream_failed', {
      workstreamId,
      workstreamKey: ws?.workstreamKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Start merge phase
async function startMerging(buildId: string) {
  const { broadcastBuildUpdate } = await import(
    './[buildId]/stream/route'
  );

  await prisma.forgeBuild.update({
    where: { id: buildId },
    data: { status: 'MERGING' },
  });

  broadcastBuildUpdate(buildId, 'merge_start', {});

  try {
    // TODO: Implement actual merging
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: { status: 'TESTING' },
    });

    broadcastBuildUpdate(buildId, 'test_start', {});

    // TODO: Run tests
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Complete
    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: {
        status: 'COMPLETED',
        testsPass: true,
        buildPass: true,
        completedAt: new Date(),
        prUrl: '#mock-pr-url', // TODO: Create actual PR
      },
    });

    broadcastBuildUpdate(buildId, 'build_complete', {
      prUrl: '#mock-pr-url',
      testsPass: true,
    });
  } catch (error) {
    await prisma.forgeBuild.update({
      where: { id: buildId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Merge failed',
      },
    });
    broadcastBuildUpdate(buildId, 'build_failed', {
      message: error instanceof Error ? error.message : 'Merge failed',
    });
  }
}
