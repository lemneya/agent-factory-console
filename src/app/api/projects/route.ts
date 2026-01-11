import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import {
  parsePaginationParams,
  buildPrismaOptions,
  createPaginatedResponse,
  buildSortOptions,
} from '@/lib/api/pagination';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);
    const orderBy = buildSortOptions(
      paginationParams.sortBy,
      paginationParams.sortOrder,
      'lastUpdated'
    );

    const where = { userId: user.id };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        ...prismaOptions,
        orderBy,
        include: {
          runs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: { runs: true, events: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(projects, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const { repoName, repoFullName, description, htmlUrl, lastUpdated } = body;

    if (!repoName || !repoFullName || !htmlUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: repoName, repoFullName, htmlUrl' },
        { status: 400 }
      );
    }

    // Check if project already exists for this user
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        repoFullName,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this repository already exists' },
        { status: 409 }
      );
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        repoName,
        repoFullName,
        description,
        htmlUrl,
        lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
      },
      include: {
        _count: {
          select: { runs: true, events: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
