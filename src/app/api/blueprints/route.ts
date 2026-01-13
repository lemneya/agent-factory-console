/**
 * AFC-1.7: Blueprint API Routes
 *
 * GET /api/blueprints?projectId=... - List blueprints
 * POST /api/blueprints - Create a new blueprint
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for Prisma to handle edge cases
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where = projectId ? { projectId } : {};

    const blueprints = await prisma.blueprint.findMany({
      where,
      include: {
        versions: {
          select: {
            id: true,
            version: true,
            schemaVersion: true,
            specHash: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { version: 'desc' },
        },
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ data: blueprints });
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch blueprints', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();

    const { projectId, name, description } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: { message: 'projectId is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        {
          error: {
            message: 'name is required and must be a non-empty string',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const blueprint = await prisma.blueprint.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        status: 'DRAFT',
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
      },
    });

    return NextResponse.json({ data: blueprint }, { status: 201 });
  } catch (error) {
    console.error('Error creating blueprint:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create blueprint', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
