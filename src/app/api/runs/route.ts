import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import {
  parsePaginationParams,
  buildPrismaOptions,
  createPaginatedResponse,
  buildSortOptions,
} from '@/lib/api/pagination';
import { RunStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status') as RunStatus | null;

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);
    const orderBy = buildSortOptions(paginationParams.sortBy, paginationParams.sortOrder);

    const where = {
      project: { userId: user.id },
      ...(projectId && { projectId }),
      ...(status && { status }),
    };

    const [runs, total] = await Promise.all([
      prisma.run.findMany({
        where,
        ...prismaOptions,
        orderBy,
        include: {
          project: {
            select: {
              id: true,
              repoName: true,
              repoFullName: true,
            },
          },
          tasks: {
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.run.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(runs, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const { projectId, name, status } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to create runs in this project' },
        { status: 403 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(RunStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const run = await prisma.run.create({
      data: {
        projectId,
        name,
        status: status || 'ACTIVE',
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });
  }
}
