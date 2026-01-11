import { NextRequest, NextResponse } from 'next/server';
import { completeTask, getWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workers/[id]/complete
 * Complete a task that the worker is working on
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { taskId, result, status, errorMsg } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Missing required field: taskId' }, { status: 400 });
    }

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Validate status if provided
    if (status && !['DONE', 'FAILED', 'BLOCKED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be DONE, FAILED, or BLOCKED' },
        { status: 400 }
      );
    }

    const task = await completeTask({
      workerId: id,
      taskId,
      result,
      status,
      errorMsg,
    });

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete task';
    console.error('Error completing task:', error);

    // Return appropriate status code based on error
    if (
      message === 'Task not found' ||
      message === 'Task is not assigned to this worker' ||
      message === 'Task is not in progress'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
