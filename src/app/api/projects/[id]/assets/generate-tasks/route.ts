import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface InstallStep {
  title: string;
  description?: string;
  command?: string;
  files?: string[];
}

interface InstallRecipe {
  steps: InstallStep[];
  prerequisites?: string[];
  postInstall?: string[];
}

// POST /api/projects/[id]/assets/generate-tasks - Generate integration tasks from asset
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assetVersionId, runId } = body;

    // Validate required fields
    if (!assetVersionId || !runId) {
      return NextResponse.json(
        { error: 'Missing required fields: assetVersionId, runId' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if run exists and belongs to project
    const run = await prisma.run.findFirst({
      where: {
        id: runId,
        projectId: id,
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check if asset version exists
    const assetVersion = await prisma.assetVersion.findUnique({
      where: { id: assetVersionId },
      include: { asset: true },
    });

    if (!assetVersion) {
      return NextResponse.json({ error: 'Asset version not found' }, { status: 404 });
    }

    // Parse the install recipe
    const installRecipe = assetVersion.installRecipe as unknown as InstallRecipe;

    if (!installRecipe || !installRecipe.steps || !Array.isArray(installRecipe.steps)) {
      return NextResponse.json(
        { error: 'Asset version has no valid install recipe' },
        { status: 400 }
      );
    }

    // Generate tasks from install recipe steps
    const tasksToCreate = installRecipe.steps.map((step: InstallStep, index: number) => ({
      runId,
      title: step.title || `Step ${index + 1}: Install ${assetVersion.asset.name}`,
      description: buildTaskDescription(step, assetVersion.asset.name),
      status: 'TODO',
      kind: 'INTEGRATE_ASSET',
      assetVersionId,
      priority: index, // Order by step sequence
    }));

    // Create all tasks
    const createdTasks = await prisma.task.createMany({
      data: tasksToCreate,
    });

    // Fetch the created tasks to return
    const tasks = await prisma.task.findMany({
      where: {
        runId,
        assetVersionId,
        kind: 'INTEGRATE_ASSET',
      },
      orderBy: { priority: 'asc' },
      include: {
        assetVersion: {
          include: { asset: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: `Created ${createdTasks.count} integration tasks`,
        tasks,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating tasks from asset:', error);
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}

// Helper function to build task description from install step
function buildTaskDescription(step: InstallStep, assetName: string): string {
  const parts: string[] = [];

  parts.push(`Integration task for ${assetName}`);

  if (step.description) {
    parts.push(`\n\n${step.description}`);
  }

  if (step.command) {
    parts.push(`\n\n**Command:**\n\`\`\`\n${step.command}\n\`\`\``);
  }

  if (step.files && step.files.length > 0) {
    parts.push(`\n\n**Files:**\n${step.files.map(f => `- ${f}`).join('\n')}`);
  }

  return parts.join('');
}
