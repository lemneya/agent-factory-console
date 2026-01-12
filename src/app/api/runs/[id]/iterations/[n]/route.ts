import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/runs/[id]/iterations/[n] - Get specific iteration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> }
) {
  try {
    const { id, n } = await params;
    const iterationNum = parseInt(n, 10);

    if (isNaN(iterationNum) || iterationNum < 1) {
      return NextResponse.json(
        { error: 'Invalid iteration number' },
        { status: 400 }
      );
    }

    const run = await prisma.run.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const iteration = await prisma.runIteration.findUnique({
      where: {
        runId_iteration: { runId: id, iteration: iterationNum },
      },
      include: {
        checkpoint: true,
      },
    });

    if (!iteration) {
      return NextResponse.json(
        { error: `Iteration ${iterationNum} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      runId: id,
      iteration,
    });
  } catch (error) {
    console.error('Error fetching iteration:', error);
    return NextResponse.json({ error: 'Failed to fetch iteration' }, { status: 500 });
  }
}
