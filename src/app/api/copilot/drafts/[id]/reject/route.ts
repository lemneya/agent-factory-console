/**
 * POST /api/copilot/drafts/[id]/reject
 * Reject a CopilotDraft
 *
 * UX-GATE-COPILOT-1: Draft Mode API
 *
 * SECURITY-0: Requires authentication and ownership verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireDraftOwnership } from '@/lib/auth-helpers';

interface RejectRequest {
  reason?: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership
    const ownershipResult = await requireDraftOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = (await request.json().catch(() => ({}))) as RejectRequest;
    const { reason } = body;

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
        { error: `Cannot reject draft with status: ${draft.status}` },
        { status: 400 }
      );
    }

    // Update draft status to REJECTED
    await prisma.copilotDraft.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    // Create audit event
    await prisma.copilotDraftEvent.create({
      data: {
        draftId: id,
        actorUserId: userId !== 'dev-bypass-user' ? userId : null,
        eventType: 'REJECTED',
        detailsJson: reason ? { reason } : undefined,
      },
    });

    return NextResponse.json({ status: 'REJECTED' });
  } catch (error) {
    console.error('Error rejecting draft:', error);
    return NextResponse.json({ error: 'Failed to reject draft' }, { status: 500 });
  }
}
