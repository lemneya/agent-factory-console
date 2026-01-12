import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/runs/[id]/ralph - Ralph mode control (start/stop/approve)
// Accepts action in body: { action: 'start' | 'stop' | 'approve' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop', 'approve'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: start, stop, approve' },
        { status: 400 }
      );
    }

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        policy: true,
        iterations: { orderBy: { iterationNumber: 'desc' }, take: 1 },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    switch (action) {
      case 'start':
        return handleStart(id, run);
      case 'stop':
        return handleStop(id, run, body.reason);
      case 'approve':
        return handleApprove(id, run);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Ralph control:', error);
    return NextResponse.json({ error: 'Failed to execute Ralph control action' }, { status: 500 });
  }
}

async function handleStart(
  runId: string,
  run: { ralphMode: boolean; status: string; policy: unknown | null }
) {
  if (run.ralphMode) {
    return NextResponse.json({ error: 'Ralph Mode is already enabled' }, { status: 409 });
  }

  if (run.status === 'COMPLETED' || run.status === 'FAILED') {
    return NextResponse.json(
      { error: 'Cannot start Ralph Mode on completed/failed run' },
      { status: 409 }
    );
  }

  // Create default policy if not exists
  if (!run.policy) {
    await prisma.runPolicy.create({
      data: {
        runId,
        maxIterations: 25,
        autoAbortOnFailure: true,
        requireHumanReview: false,
      },
    });
  }

  // Enable Ralph Mode
  const updatedRun = await prisma.run.update({
    where: { id: runId },
    data: { ralphMode: true },
    include: { policy: true },
  });

  // Create first iteration
  await prisma.runIteration.create({
    data: {
      runId,
      iterationNumber: 1,
      status: 'RUNNING',
    },
  });

  return NextResponse.json({
    message: 'Ralph Mode started',
    run: updatedRun,
    iteration: 1,
  });
}

async function handleStop(runId: string, run: { ralphMode: boolean }, reason?: string) {
  if (!run.ralphMode) {
    return NextResponse.json({ error: 'Ralph Mode is not enabled' }, { status: 409 });
  }

  // Record abort reason
  await prisma.runAbortReason.upsert({
    where: { runId },
    update: {
      reason: reason || 'Manual stop requested',
      code: 'HUMAN_ABORT',
    },
    create: {
      runId,
      reason: reason || 'Manual stop requested',
      code: 'HUMAN_ABORT',
    },
  });

  // Update current iteration to ABORTED
  await prisma.runIteration.updateMany({
    where: { runId, status: 'RUNNING' },
    data: { status: 'ABORTED' },
  });

  // Disable Ralph Mode and mark run as failed
  const updatedRun = await prisma.run.update({
    where: { id: runId },
    data: { ralphMode: false, status: 'FAILED', completedAt: new Date() },
  });

  return NextResponse.json({
    message: 'Ralph Mode stopped',
    run: updatedRun,
  });
}

async function handleApprove(
  runId: string,
  run: {
    ralphMode: boolean;
    iterations: Array<{ id: string; status: string; iterationNumber: number }>;
  }
) {
  if (!run.ralphMode) {
    return NextResponse.json({ error: 'Ralph Mode is not enabled' }, { status: 409 });
  }

  const lastIteration = run.iterations[0];
  if (!lastIteration || lastIteration.status !== 'WAITING_FOR_APPROVAL') {
    return NextResponse.json({ error: 'No iteration waiting for approval' }, { status: 409 });
  }

  // Update the waiting iteration to indicate approval received
  await prisma.runIteration.update({
    where: { id: lastIteration.id },
    data: { status: 'PASSED' },
  });

  // Create next iteration
  const nextIteration = await prisma.runIteration.create({
    data: {
      runId,
      iterationNumber: lastIteration.iterationNumber + 1,
      status: 'RUNNING',
    },
  });

  return NextResponse.json({
    message: 'Approval received, resuming Ralph Mode',
    iteration: nextIteration.iterationNumber,
  });
}
