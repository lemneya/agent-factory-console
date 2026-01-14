/**
 * AFC-1.6: Memory Layer MVP - Run Memory Snapshots API
 *
 * GET /api/runs/[id]/memory/snapshots
 * List memory snapshots for a run.
 *
 * POST /api/runs/[id]/memory/snapshots
 * Create a new memory snapshot for this run.
 */

import { NextRequest, NextResponse } from 'next/server';

import type { MemorySnapshot } from '@/memory/provider';



interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: runId } = context.params;

    const { default: prisma } = await import("@/lib/prisma");
    const { getMemoryProvider } = await import("@/memory/prismaProvider");

    // Verify run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const provider = getMemoryProvider(prisma);
    const snapshots = await provider.getSnapshots(runId);

    return NextResponse.json({
      runId,
      snapshots,
    });
  } catch (error) {
    console.error('Error getting memory snapshots:', error);
    return NextResponse.json({ error: 'Failed to get memory snapshots' }, { status: 500 });
  }
}

interface CreateSnapshotBody {
  name?: string;
  description?: string;
  itemIds: string[];
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: runId } = context.params;
    const body: CreateSnapshotBody = await request.json();

    if (!body.itemIds || !Array.isArray(body.itemIds) || body.itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: itemIds (array of memory item IDs)' },
        { status: 400 }
      );
    }

    const { default: prisma } = await import("@/lib/prisma");
    const { getMemoryProvider } = await import("@/memory/prismaProvider");

    // Verify run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const provider = getMemoryProvider(prisma);
    const snapshotId = await provider.createSnapshot({
      runId,
      name: body.name,
      description: body.description,
      itemIds: body.itemIds,
      metadata: body.metadata,
    });

    // Get the created snapshot details
    const snapshots = await provider.getSnapshots(runId);
    const snapshot = snapshots.find((s: MemorySnapshot) => s.id === snapshotId);

    return NextResponse.json(
      {
        success: true,
        snapshot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating memory snapshot:', error);
    return NextResponse.json({ error: 'Failed to create memory snapshot' }, { status: 500 });
  }
}
