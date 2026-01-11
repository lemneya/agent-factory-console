import { NextRequest, NextResponse } from 'next/server';
import {
  getQueueStats,
  getPendingTasks,
  getInProgressTasks,
} from '@/lib/workers';

/**
 * GET /api/queue
 * Get queue status and task information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || undefined;
    const view = searchParams.get('view') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    switch (view) {
      case 'pending': {
        const tasks = await getPendingTasks(runId, limit);
        return NextResponse.json({ tasks, count: tasks.length });
      }

      case 'in_progress': {
        const tasks = await getInProgressTasks();
        return NextResponse.json({ tasks, count: tasks.length });
      }

      case 'stats':
      default: {
        const stats = await getQueueStats();
        return NextResponse.json({ stats });
      }
    }
  } catch (error) {
    console.error('Error fetching queue info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue info' },
      { status: 500 }
    );
  }
}
