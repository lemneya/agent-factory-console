import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// AFC-1.1: SSE keepalive interval (15 seconds)
const KEEPALIVE_INTERVAL_MS = 15 * 1000;
// AFC-1.1: Status check interval (2 seconds)
const STATUS_CHECK_INTERVAL_MS = 2 * 1000;

/**
 * GET /api/runs/:id/stream
 * AFC-1.1: SSE endpoint for real-time run status updates
 * Includes keepalive ping every 15 seconds
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  // Verify run exists
  const run = await prisma.run.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return new Response('Run not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = run.status;
      let isActive = true;

      // Send initial status
      const initialEvent = `event: status\ndata: ${JSON.stringify({
        runId,
        status: run.status,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialEvent));

      // AFC-1.1: Keepalive ping every 15 seconds
      const keepaliveInterval = setInterval(() => {
        if (!isActive) return;
        try {
          const pingEvent = `event: ping\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingEvent));
        } catch {
          // Stream closed
          isActive = false;
        }
      }, KEEPALIVE_INTERVAL_MS);

      // Check for status changes every 2 seconds
      const statusInterval = setInterval(async () => {
        if (!isActive) return;
        try {
          const currentRun = await prisma.run.findUnique({
            where: { id: runId },
            include: {
              tasks: {
                select: {
                  id: true,
                  status: true,
                  title: true,
                },
              },
            },
          });

          if (!currentRun) {
            isActive = false;
            return;
          }

          // Send update if status changed
          if (currentRun.status !== lastStatus) {
            lastStatus = currentRun.status;
            const statusEvent = `event: status\ndata: ${JSON.stringify({
              runId,
              status: currentRun.status,
              tasks: currentRun.tasks,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(statusEvent));

            // If run is completed, close the stream
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentRun.status)) {
              isActive = false;
              clearInterval(keepaliveInterval);
              clearInterval(statusInterval);
              controller.close();
            }
          }
        } catch {
          // Stream closed or error
          isActive = false;
        }
      }, STATUS_CHECK_INTERVAL_MS);

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(keepaliveInterval);
        clearInterval(statusInterval);
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
