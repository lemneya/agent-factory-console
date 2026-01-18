/**
 * POST /api/runner/execute
 *
 * AFC-RUNNER-0: Execute approved WorkOrders to create a PR
 *
 * SAFETY GATES:
 * - Requires authentication
 * - Requires Council Gate satisfaction (if project specified)
 * - WorkOrders must be in PENDING status
 * - No silent writes - all actions are logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeWorkOrders } from '@/services/runner';

interface ExecuteRequestBody {
  targetRepoOwner: string;
  targetRepoName: string;
  targetBranch?: string;
  workOrderIds: string[];
  projectId?: string;
  councilDecisionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for dev auth bypass
    const devAuthBypass =
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'test';

    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { id?: string }).id || session.user.email
      : null;

    // Require authentication unless dev bypass
    if (!userId && !devAuthBypass) {
      return NextResponse.json(
        { error: 'Authentication required to execute work orders' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ExecuteRequestBody = await request.json();

    // Validate required fields
    if (!body.targetRepoOwner || !body.targetRepoName) {
      return NextResponse.json(
        { error: 'targetRepoOwner and targetRepoName are required' },
        { status: 400 }
      );
    }

    if (!body.workOrderIds || body.workOrderIds.length === 0) {
      return NextResponse.json(
        { error: 'workOrderIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Execute work orders
    const result = await executeWorkOrders({
      targetRepoOwner: body.targetRepoOwner,
      targetRepoName: body.targetRepoName,
      targetBranch: body.targetBranch,
      workOrderIds: body.workOrderIds,
      userId: userId || 'dev-bypass',
      projectId: body.projectId,
      councilDecisionId: body.councilDecisionId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          executionRunId: result.executionRunId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      executionRunId: result.executionRunId,
      prUrl: result.prUrl,
      prNumber: result.prNumber,
    });
  } catch (error) {
    console.error('Error executing work orders:', error);
    return NextResponse.json({ error: 'Failed to execute work orders' }, { status: 500 });
  }
}
