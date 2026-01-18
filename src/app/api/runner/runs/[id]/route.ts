/**
 * GET /api/runner/runs/[id]
 *
 * AFC-RUNNER-0: Get execution run details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutionRun } from '@/services/runner';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const run = await getExecutionRun(id);

    if (!run) {
      return NextResponse.json(
        { error: 'Execution run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch (error) {
    console.error('Error getting execution run:', error);
    return NextResponse.json(
      { error: 'Failed to get execution run' },
      { status: 500 }
    );
  }
}
