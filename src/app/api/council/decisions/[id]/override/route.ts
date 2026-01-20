/**
 * POST /api/council/decisions/[id]/override
 *
 * SECURITY-0: Override requires:
 * - Authentication (session required)
 * - Ownership verification (user must own the project)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireCouncilDecisionOwnership } from '@/lib/auth-helpers';

// POST /api/council/decisions/[id]/override - Override a decision with justification
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via project)
    const ownershipResult = await requireCouncilDecisionOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { decision, rationale, overrideReason } = body;

    // Get the original decision
    const originalDecision = await prisma.councilDecision.findUnique({
      where: { id },
    });

    if (!originalDecision) {
      return NextResponse.json({ error: 'Original Council decision not found' }, { status: 404 });
    }

    // Validate required fields
    if (!decision || !['ADOPT', 'ADAPT', 'BUILD'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be ADOPT, ADAPT, or BUILD' },
        { status: 400 }
      );
    }
    if (!overrideReason) {
      return NextResponse.json({ error: 'overrideReason is required' }, { status: 400 });
    }
    if (!rationale) {
      return NextResponse.json({ error: 'rationale is required' }, { status: 400 });
    }

    // Create new decision that overrides the original
    const newDecision = await prisma.councilDecision.create({
      data: {
        projectId: originalDecision.projectId,
        taskId: originalDecision.taskId,
        decision,
        rationale,
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(newDecision, { status: 201 });
  } catch (error) {
    console.error('Error overriding Council decision:', error);
    return NextResponse.json({ error: 'Failed to override Council decision' }, { status: 500 });
  }
}
