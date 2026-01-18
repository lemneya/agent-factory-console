/**
 * POST /api/workorders/[id]/execute
 *
 * AFC-RUNNER-0: Execute a single WorkOrder
 *
 * This endpoint provides a convenient way to execute a single work order
 * from the WorkOrder detail page. It wraps the runner/execute endpoint.
 *
 * SAFETY GATES:
 * - Requires authentication
 * - WorkOrder must be in PENDING status
 * - Council Gate must be satisfied (if project specified)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeWorkOrders } from '@/services/runner';

interface ExecuteRequestBody {
  targetRepoOwner: string;
  targetRepoName: string;
  targetBranch?: string;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

    // Fetch the work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        blueprint: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Parse request body for target repo
    const body: ExecuteRequestBody = await request.json();

    if (!body.targetRepoOwner || !body.targetRepoName) {
      return NextResponse.json(
        { error: 'targetRepoOwner and targetRepoName are required' },
        { status: 400 }
      );
    }

    // Execute the work order
    const result = await executeWorkOrders({
      targetRepoOwner: body.targetRepoOwner,
      targetRepoName: body.targetRepoName,
      targetBranch: body.targetBranch,
      workOrderIds: [id],
      userId: userId || 'dev-bypass',
      projectId: workOrder.blueprint?.projectId || undefined,
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
    console.error('Error executing work order:', error);
    return NextResponse.json({ error: 'Failed to execute work order' }, { status: 500 });
  }
}
