import { NextRequest, NextResponse } from 'next/server';
import { recordHeartbeat, getWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workers/[id]/heartbeat
 * Record a heartbeat for a worker
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const worker = await recordHeartbeat(id);

    return NextResponse.json({
      success: true,
      worker: {
        id: worker.id,
        status: worker.status,
        lastHeartbeat: worker.lastHeartbeat,
      },
    });
  } catch (error) {
    console.error('Error recording heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to record heartbeat' },
      { status: 500 }
    );
  }
}
