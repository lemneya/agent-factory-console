/**
 * GET/DELETE /api/council/decisions/[id]
 *
 * SECURITY-0: DELETE requires:
 * - Authentication (session required)
 * - Ownership verification (user must own the project)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireCouncilDecisionOwnership } from '@/lib/auth-helpers';

// GET /api/council/decisions/[id] - Get specific decision details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const decision = await prisma.councilDecision.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Council decision not found' }, { status: 404 });
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error('Error fetching Council decision:', error);
    return NextResponse.json({ error: 'Failed to fetch Council decision' }, { status: 500 });
  }
}

// DELETE /api/council/decisions/[id] - Delete a decision
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via project)
    const ownershipResult = await requireCouncilDecisionOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    await prisma.councilDecision.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Council decision deleted' });
  } catch (error) {
    console.error('Error deleting Council decision:', error);
    return NextResponse.json({ error: 'Failed to delete Council decision' }, { status: 500 });
  }
}
