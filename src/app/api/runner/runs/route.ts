/**
 * GET /api/runner/runs
 *
 * AFC-RUNNER-0: List execution runs
 */

import { NextRequest, NextResponse } from 'next/server';
import { listExecutionRuns } from '@/services/runner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const runs = await listExecutionRuns(projectId, limit);

    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Error listing execution runs:', error);
    return NextResponse.json(
      { error: 'Failed to list execution runs' },
      { status: 500 }
    );
  }
}
