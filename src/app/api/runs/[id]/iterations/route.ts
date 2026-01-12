import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/runs/[id]/iterations - Get all iterations for a run
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const run = await prisma.run.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const [iterations, total] = await Promise.all([
      prisma.runIteration.findMany({
        where: { runId: id },
        include: {
          checkpoint: {
            select: {
              id: true,
              checkpointId: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { iteration: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.runIteration.count({ where: { runId: id } }),
    ]);

    // Calculate stats
    const stats = {
      total,
      passed: iterations.filter(i => i.status === 'PASSED').length,
      failed: iterations.filter(i => i.status === 'FAILED').length,
      running: iterations.filter(i => i.status === 'RUNNING').length,
      waiting: iterations.filter(i => i.status === 'WAITING_FOR_APPROVAL').length,
      aborted: iterations.filter(i => i.status === 'ABORTED').length,
    };

    return NextResponse.json({
      runId: id,
      iterations,
      stats,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching iterations:', error);
    return NextResponse.json({ error: 'Failed to fetch iterations' }, { status: 500 });
  }
}
