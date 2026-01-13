/**
 * POST /api/copilot/drafts/[id]/reject
 * Reject a CopilotDraft
 *
 * UX-GATE-COPILOT-1: Draft Mode API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RejectRequest {
  reason?: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as RejectRequest;
    const { reason } = body;

    // Get user session (optional)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

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
        actorUserId: userId,
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
