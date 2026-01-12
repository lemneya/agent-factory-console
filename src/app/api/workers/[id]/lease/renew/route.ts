import { NextRequest, NextResponse } from 'next/server';
import { renewLease, getWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workers/[id]/lease/renew
 * AFC-1.1: Renew the lease for a worker's current task
 * Should be called every 20-30s while processing
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Verify worker exists
    const worker = await getWorker(id);
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const task = await renewLease(id, taskId);

    return NextResponse.json({
      message: 'Lease renewed',
      task: {
        id: task.id,
        leaseExpiresAt: task.leaseExpiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to renew lease';
    console.error('Error renewing lease:', error);

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
