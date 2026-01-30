/**
 * AFC-C2-STREAM-0: SSE Stream for C2 Dashboard
 *
 * GET /api/c2/stream?sessionId=... - SSE endpoint for real-time C2 events
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireC2SessionOwnership } from '@/lib/auth-helpers';
import { subscribeToSession, C2StreamEvent } from '@/lib/c2-pubsub';

// Keepalive interval (15 seconds)
const KEEPALIVE_INTERVAL_MS = 15 * 1000;

/**
 * GET /api/c2/stream?sessionId=...
 * SSE endpoint for real-time C2 session events
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  // Get session ID from query params
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId query parameter', { status: 400 });
  }

  // Check ownership
  const ownershipResult = await requireC2SessionOwnership(sessionId, userId);
  if (ownershipResult.error) return ownershipResult.error;

  // Verify session exists
  const session = await prisma.c2Session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;

      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        sessionId,
        status: session.status,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Subscribe to session events
      const unsubscribe = subscribeToSession(sessionId, (event: C2StreamEvent) => {
        if (!isActive) return;
        try {
          const sseEvent = `event: ${event.type.toLowerCase()}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        } catch {
          // Stream closed
          isActive = false;
        }
      });

      // Keepalive ping every 15 seconds
      const keepaliveInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(keepaliveInterval);
          return;
        }
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          // Stream closed
          isActive = false;
          clearInterval(keepaliveInterval);
        }
      }, KEEPALIVE_INTERVAL_MS);

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(keepaliveInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
