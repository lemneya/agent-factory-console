import { NextRequest, NextResponse } from 'next/server';
import { claimTask, getWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workers/[id]/claim
 * Claim the next available task for a worker
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { runId, capabilities } = body;

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const task = await claimTask({
      workerId: id,
      runId,
      capabilities,
    });

    if (!task) {
      return NextResponse.json(
        { message: 'No tasks available', task: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to claim task';
    console.error('Error claiming task:', error);

    // Return appropriate status code based on error
    if (
      message === 'Worker already has a task in progress' ||
      message === 'Worker is offline'
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
