/**
 * POST /api/copilot/drafts/[id]/approve
 * Approve a CopilotDraft and execute the real action
 *
 * UX-GATE-COPILOT-1.1: Refactored to use planDraftActions
 *
 * SAFETY: This is the ONLY route that performs real actions.
 * It must:
 * - Confirm status == DRAFT
 * - Require authenticated user (unless NEXT_PUBLIC_DEV_AUTH_BYPASS=true)
 * - Generate plan using planDraftActions (same as diff endpoint)
 * - Execute the plan using executeDraftPlan
 * - Set draft status to APPROVED
 * - Write CopilotDraftEvent APPROVED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { planDraftActions, executeDraftPlan, DraftKind } from '@/services/draft/planner';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check for dev auth bypass
    const devAuthBypass =
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'test';

    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Require authentication unless dev bypass
    if (!userId && !devAuthBypass) {
      return NextResponse.json(
        { error: 'Authentication required to approve drafts' },
        { status: 401 }
      );
    }

    // Check for diffReviewed flag in request body
    let diffReviewed = false;
    try {
      const body = await request.json();
      diffReviewed = body?.diffReviewed === true;
    } catch {
      // No body or invalid JSON - diffReviewed remains false
    }

    // Require diff review confirmation
    if (!diffReviewed && !devAuthBypass) {
      return NextResponse.json(
        { error: 'Diff review confirmation required. Set diffReviewed: true in request body.' },
        { status: 400 }
      );
    }

    // Fetch the draft
    const draft = await prisma.copilotDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Confirm status is DRAFT
    if (draft.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot approve draft with status: ${draft.status}` },
        { status: 400 }
      );
    }

    // Generate the plan using the same function as diff endpoint
    // This ensures no divergence between "what UI shows" and "what approve does"
    const plan = await planDraftActions(
      {
        id: draft.id,
        kind: draft.kind as DraftKind,
        payloadJson: draft.payloadJson as string,
        projectId: draft.projectId,
      },
      { dryRun: false }
    );

    // Check for Council Gate if required
    if (plan.checks.councilRequired && !plan.checks.councilSatisfied) {
      return NextResponse.json(
        {
          error:
            'Council Gate: No Council decision found for this project. Create a Council decision first.',
          plan,
        },
        { status: 403 }
      );
    }

    // Execute the plan
    const result = await executeDraftPlan(plan, {
      id: draft.id,
      kind: draft.kind as DraftKind,
      payloadJson: draft.payloadJson as string,
      projectId: draft.projectId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to execute draft plan', plan },
        { status: 500 }
      );
    }

    // Update draft status to APPROVED
    await prisma.copilotDraft.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId || 'dev-bypass',
        resultRef: result.resultRef,
      },
    });

    // Create audit event
    await prisma.copilotDraftEvent.create({
      data: {
        draftId: id,
        actorUserId: userId,
        eventType: 'APPROVED',
        detailsJson: {
          resultRef: result.resultRef,
          plan: {
            operations: plan.operations.map(op => ({
              op: op.op,
              model: op.model,
              summary: op.summary,
            })),
            checks: plan.checks,
          },
        } as any,
      },
    });

    return NextResponse.json({
      resultRef: result.resultRef,
      status: 'APPROVED',
      plan,
    });
  } catch (error) {
    console.error('Error approving draft:', error);
    return NextResponse.json({ error: 'Failed to approve draft' }, { status: 500 });
  }
}
