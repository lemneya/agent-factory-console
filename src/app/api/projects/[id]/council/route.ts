import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/projects/[id]/council - Get Council decisions for a project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const decision = searchParams.get('decision');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { projectId: id };

    if (decision && ['ADOPT', 'ADAPT', 'BUILD'].includes(decision)) {
      where.decision = decision;
    }

    const [decisions, total] = await Promise.all([
      prisma.councilDecision.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.councilDecision.count({ where }),
    ]);

    return NextResponse.json({
      project: {
        id: project.id,
        repoName: project.repoName,
        repoFullName: project.repoFullName,
      },
      decisions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching project Council decisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project Council decisions' },
      { status: 500 }
    );
  }
}
