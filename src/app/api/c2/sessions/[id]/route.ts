/**
 * AFC-C2-STREAM-0: C2 Session by ID API
 *
 * GET /api/c2/sessions/:id - Get a specific C2 session
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireC2SessionOwnership } from '@/lib/auth-helpers';

/**
 * GET /api/c2/sessions/:id
 * Get a specific C2 session with events and artifacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  const { id } = await params;

  // Check ownership
  const ownershipResult = await requireC2SessionOwnership(id, userId);
  if (ownershipResult.error) return ownershipResult.error;

  try {
    const session = await prisma.c2Session.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        artifacts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            events: true,
            artifacts: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('[C2 Session] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
