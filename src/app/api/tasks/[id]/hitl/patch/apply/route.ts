import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface HITLPatch {
  id: string;
  filename: string;
  diff: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt?: string;
  reviewedBy?: string;
}

interface HITLData {
  questions?: unknown[];
  patches?: HITLPatch[];
}

/**
 * POST /api/tasks/[id]/hitl/patch/apply
 * Approve or reject a patch for application
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { patchId, action, reviewedBy } = body;

    if (!patchId) {
      return NextResponse.json(
        { error: 'patchId is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        hitlJson: true,
        status: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Parse current HITL data
    const hitlData = (task.hitlJson as HITLData) || { questions: [], patches: [] };
    const patches = hitlData.patches || [];

    // Find and update the patch
    const patchIndex = patches.findIndex((p) => p.id === patchId);
    if (patchIndex === -1) {
      return NextResponse.json(
        { error: 'Patch not found' },
        { status: 404 }
      );
    }

    // Update the patch status
    patches[patchIndex] = {
      ...patches[patchIndex],
      status: action === 'approve' ? 'approved' : 'rejected',
      appliedAt: action === 'approve' ? new Date().toISOString() : undefined,
      reviewedBy: reviewedBy || 'human',
    };

    // Check if all patches are reviewed
    const allReviewed = patches.every((p) => p.status !== 'pending');

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        hitlJson: JSON.parse(JSON.stringify({ ...hitlData, patches })),
      },
      select: {
        id: true,
        title: true,
        status: true,
        hitlJson: true,
        blockedReason: true,
      },
    });

    return NextResponse.json({
      taskId: updatedTask.id,
      patchId,
      action,
      status: patches[patchIndex].status,
      allReviewed,
      hitl: updatedTask.hitlJson,
    });
  } catch (error) {
    console.error('Error applying HITL patch:', error);
    return NextResponse.json(
      { error: 'Failed to apply patch' },
      { status: 500 }
    );
  }
}
