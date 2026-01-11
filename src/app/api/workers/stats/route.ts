import { NextResponse } from 'next/server';
import { getWorkerStats, markStaleWorkersOffline } from '@/lib/workers';

/**
 * GET /api/workers/stats
 * Get worker statistics
 */
export async function GET() {
  try {
    // First, mark any stale workers as offline
    const staleCount = await markStaleWorkersOffline();

    const stats = await getWorkerStats();

    return NextResponse.json({
      stats,
      staleWorkersMarkedOffline: staleCount,
    });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker stats' },
      { status: 500 }
    );
  }
}
