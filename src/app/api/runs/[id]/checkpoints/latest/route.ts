import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/runs/:id/checkpoints/latest - Get the latest checkpoint for a run
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;

    // AFC-1.1: Fetch latest checkpoint by threadId (which equals runId)
    const checkpoint = await prisma.runCheckpoint.findFirst({
      where: { threadId: runId },
      orderBy: { createdAt: 'desc' },
    });

    if (!checkpoint) {
      return NextResponse.json({ error: 'No checkpoint found' }, { status: 404 });
    }

    return NextResponse.json(checkpoint);
  } catch (error) {
    console.error('Error fetching latest checkpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch latest checkpoint' }, { status: 500 });
  }
}
