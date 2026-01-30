/**
 * AFC-C2-STREAM-0: C2 Sessions API
 *
 * POST /api/c2/sessions - Create a new C2 session
 * GET  /api/c2/sessions - List C2 sessions for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * GET /api/c2/sessions
 * List C2 sessions for the authenticated user (strict ownership)
 */
export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    // Strict ownership: only return sessions owned by this user
    const sessions = await prisma.c2Session.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            events: true,
            artifacts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[C2 Sessions] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST /api/c2/sessions
 * Create a new C2 session
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const body = await request.json();
    const { name, projectId, agentCount, gridRows, gridCols } = body;

    const session = await prisma.c2Session.create({
      data: {
        userId,
        projectId: projectId || null,
        name: name || 'Unnamed Session',
        agentCount: agentCount ?? 20,
        gridRows: gridRows ?? 4,
        gridCols: gridCols ?? 5,
        status: 'IDLE',
      },
      include: {
        _count: {
          select: {
            events: true,
            artifacts: true,
          },
        },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('[C2 Sessions] POST error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
