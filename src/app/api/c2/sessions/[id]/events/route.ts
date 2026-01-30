/**
 * AFC-C2-STREAM-0: C2 Session Events API
 *
 * POST /api/c2/sessions/:id/events - Add an event to a C2 session
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireC2SessionOwnership } from '@/lib/auth-helpers';
import { publishToSession, createC2Event } from '@/lib/c2-pubsub';
import { C2EventType, C2AgentState } from '@prisma/client';

/**
 * POST /api/c2/sessions/:id/events
 * Add an event to a C2 session (and publish to SSE subscribers)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  const { id: sessionId } = await params;

  // Check ownership
  const ownershipResult = await requireC2SessionOwnership(sessionId, userId);
  if (ownershipResult.error) return ownershipResult.error;

  try {
    const body = await request.json();
    const { type, payload, agentIndex, agentState, progress, level, message } = body;

    // Validate event type
    const validTypes: C2EventType[] = [
      'SESSION_START',
      'SESSION_STOP',
      'SESSION_ABORT',
      'AGENT_STATE',
      'PROGRESS',
      'LOG',
      'ARTIFACT_CREATED',
      'PING',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Create event in database
    const event = await prisma.c2Event.create({
      data: {
        sessionId,
        type: type as C2EventType,
        payload: payload || {},
        agentIndex: agentIndex ?? null,
        agentState: agentState as C2AgentState | null,
        progress: progress ?? null,
        level: level ?? null,
        message: message ?? null,
      },
    });

    // Publish to SSE subscribers
    publishToSession(
      sessionId,
      createC2Event(sessionId, type as C2EventType, payload || {}, {
        agentIndex,
        agentState: agentState as C2AgentState | undefined,
        progress,
        level,
        message,
      })
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('[C2 Events] POST error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
