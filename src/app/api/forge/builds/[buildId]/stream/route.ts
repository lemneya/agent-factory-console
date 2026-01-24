import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Store active SSE connections by buildId
const buildConnections = new Map<string, Set<ReadableStreamDefaultController>>();

// Export for use by execution engine
export function broadcastBuildUpdate(buildId: string, event: string, data: unknown) {
  const connections = buildConnections.get(buildId);
  if (!connections) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const controller of connections) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      // Connection closed, will be cleaned up
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;

  // Verify build exists
  const build = await prisma.forgeBuild.findUnique({
    where: { id: buildId },
    include: {
      workstreams: true,
      questions: true,
    },
  });

  if (!build) {
    return new Response('Build not found', { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add to connections
      if (!buildConnections.has(buildId)) {
        buildConnections.set(buildId, new Set());
      }
      buildConnections.get(buildId)!.add(controller);

      // Send initial state
      const initialData = {
        build: {
          id: build.id,
          status: build.status,
          currentWave: build.currentWave,
          totalWaves: build.totalWaves,
          errorMessage: build.errorMessage,
          prUrl: build.prUrl,
        },
        workstreams: build.workstreams.map((ws) => ({
          id: ws.id,
          workstreamKey: ws.workstreamKey,
          name: ws.name,
          agent: ws.agent,
          wave: ws.wave,
          status: ws.status,
          output: ws.output?.slice(0, 200),
          errorMessage: ws.errorMessage,
        })),
        questions: build.questions.map((q) => ({
          id: q.id,
          workstreamId: q.workstreamId,
          question: q.question,
          questionType: q.questionType,
          optionsJson: q.optionsJson,
          answer: q.answer,
          answeredAt: q.answeredAt,
        })),
      };

      controller.enqueue(
        new TextEncoder().encode(`event: init\ndata: ${JSON.stringify(initialData)}\n\n`)
      );

      // Keep-alive ping every 30s
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        buildConnections.get(buildId)?.delete(controller);
        if (buildConnections.get(buildId)?.size === 0) {
          buildConnections.delete(buildId);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
