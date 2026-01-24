import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/forge/builds/[buildId] - Get build details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;

  try {
    const build = await prisma.forgeBuild.findUnique({
      where: { id: buildId },
      include: {
        workstreams: {
          orderBy: [{ wave: 'asc' }, { priority: 'asc' }],
        },
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    return NextResponse.json({
      build: {
        id: build.id,
        spec: build.spec,
        techStack: build.techStackJson,
        decomposition: build.decomposedJson,
        status: build.status,
        currentWave: build.currentWave,
        totalWaves: build.totalWaves,
        errorMessage: build.errorMessage,
        prUrl: build.prUrl,
        testsPass: build.testsPass,
        buildPass: build.buildPass,
        createdAt: build.createdAt,
        completedAt: build.completedAt,
      },
      workstreams: build.workstreams.map((ws) => ({
        id: ws.id,
        workstreamKey: ws.workstreamKey,
        name: ws.name,
        agent: ws.agent,
        wave: ws.wave,
        status: ws.status,
        ownsFiles: ws.ownsFiles,
        producesFiles: ws.producesFiles,
        blockedBy: ws.blockedBy,
        prompt: ws.prompt,
        output: ws.output,
        errorMessage: ws.errorMessage,
        filesCreated: ws.filesCreated,
        filesModified: ws.filesModified,
        durationMs: ws.durationMs,
        createdAt: ws.createdAt,
        completedAt: ws.completedAt,
      })),
      questions: build.questions.map((q) => ({
        id: q.id,
        workstreamId: q.workstreamId,
        question: q.question,
        questionType: q.questionType,
        options: q.optionsJson,
        answer: q.answer,
        answeredAt: q.answeredAt,
        createdAt: q.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to get build:', error);
    return NextResponse.json(
      { error: 'Failed to get build' },
      { status: 500 }
    );
  }
}
