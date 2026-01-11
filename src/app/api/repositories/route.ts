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

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const isPrivate = searchParams.get('private');

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);
    const orderBy = buildSortOptions(
      paginationParams.sortBy,
      paginationParams.sortOrder,
      'updatedAt'
    );

    const where = {
      ...(language && { language }),
      ...(isPrivate !== null && { private: isPrivate === 'true' }),
    };

    const [repositories, total] = await Promise.all([
      prisma.repository.findMany({
        where,
        ...prismaOptions,
        orderBy,
        include: {
          _count: {
            select: { pullRequests: true, issues: true },
          },
        },
      }),
      prisma.repository.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(repositories, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      githubId,
      name,
      fullName,
      description,
      htmlUrl,
      cloneUrl,
      sshUrl,
      defaultBranch,
      language,
      private: isPrivate,
    } = body;

    if (!githubId || !name || !fullName || !htmlUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: githubId, name, fullName, htmlUrl' },
        { status: 400 }
      );
    }

    // Check if repository already exists
    const existingRepo = await prisma.repository.findUnique({
      where: { githubId },
    });

    if (existingRepo) {
      // Update existing repository
      const repository = await prisma.repository.update({
        where: { githubId },
        data: {
          name,
          fullName,
          description,
          htmlUrl,
          cloneUrl,
          sshUrl,
          defaultBranch,
          language,
          private: isPrivate ?? false,
        },
        include: {
          _count: {
            select: { pullRequests: true, issues: true },
          },
        },
      });

      return NextResponse.json(repository);
    }

    // Create new repository
    const repository = await prisma.repository.create({
      data: {
        githubId,
        name,
        fullName,
        description,
        htmlUrl,
        cloneUrl,
        sshUrl,
        defaultBranch,
        language,
        private: isPrivate ?? false,
      },
      include: {
        _count: {
          select: { pullRequests: true, issues: true },
        },
      },
    });

    return NextResponse.json(repository, { status: 201 });
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    );
  }
}
