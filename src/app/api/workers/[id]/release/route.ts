import { NextRequest, NextResponse } from 'next/server';
import { releaseTask, getWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workers/[id]/release
 * Release a task back to the queue
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Missing required field: taskId' }, { status: 400 });
    }

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const task = await releaseTask(id, taskId);

    return NextResponse.json({ task, released: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to release task';
    console.error('Error releasing task:', error);

    // Return appropriate status code based on error
    if (message === 'Task not found' || message === 'Task is not assigned to this worker') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
