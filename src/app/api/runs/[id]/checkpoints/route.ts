import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/runs/:id/checkpoints - Create a new checkpoint
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: runId } = await params;
    const body = await request.json();
    const { graphVersion, graphHash, checkpointId, nextNode, status, stateJson } = body;

    if (!graphVersion || !checkpointId || !status || !stateJson) {
      return NextResponse.json(
        { error: 'Missing required fields: graphVersion, checkpointId, status, stateJson' },
        { status: 400 }
      );
    }

    // Verify run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // AFC-1.1: threadId MUST equal runId
    const checkpoint = await prisma.runCheckpoint.create({
      data: {
        runId,
        threadId: runId, // AFC-1.1 rule: threadId = runId always
        graphVersion,
        graphHash,
        checkpointId,
        nextNode,
        status,
        stateJson,
      },
    });

    return NextResponse.json(checkpoint, { status: 201 });
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 });
  }
}

// GET /api/runs/:id/checkpoints - List all checkpoints for a run
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: runId } = await params;

    const checkpoints = await prisma.runCheckpoint.findMany({
      where: { runId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch checkpoints' }, { status: 500 });
  }
}
