/**
 * AFC-1.6: Memory Layer MVP - Run Memory Uses API
 *
 * GET /api/runs/[id]/memory/uses
 * Get memory usage history for a run.
 *
 * POST /api/runs/[id]/memory/uses
 * Record usage of a memory item in this run.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMemoryProvider } from '@/memory/prismaProvider';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: runId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    // Verify run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const provider = getMemoryProvider(prisma);
    const uses = await provider.getUsesForRun(runId, limit);

    return NextResponse.json({
      runId,
      uses: uses.map(u => ({
        memoryItem: {
          id: u.memoryItem.id,
          content: u.memoryItem.content,
          summary: u.memoryItem.summary,
          category: u.memoryItem.category,
          score: u.memoryItem.score,
          tokenCount: u.memoryItem.tokenCount,
        },
        usedAt: u.usedAt,
        context: u.context,
      })),
      total: uses.length,
    });
  } catch (error) {
    console.error('Error getting memory uses:', error);
    return NextResponse.json(
      { error: 'Failed to get memory uses' },
      { status: 500 }
    );
  }
}

interface RecordUseBody {
  memoryItemId: string;
  context?: string;
  queryText?: string;
  relevance?: number;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: runId } = await context.params;
    const body: RecordUseBody = await request.json();

    if (!body.memoryItemId) {
      return NextResponse.json(
        { error: 'Missing required field: memoryItemId' },
        { status: 400 }
      );
    }

    // Verify run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const provider = getMemoryProvider(prisma);
    await provider.recordUse({
      memoryItemId: body.memoryItemId,
      runId,
      context: body.context,
      queryText: body.queryText,
      relevance: body.relevance,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error recording memory use:', error);
    return NextResponse.json(
      { error: 'Failed to record memory use' },
      { status: 500 }
    );
  }
}
