/**
 * AFC-1.7: Blueprint Detail API Routes
 *
 * GET /api/blueprints/[id] - Get blueprint details
 * PATCH /api/blueprints/[id] - Update blueprint (name, description, status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlueprintStatus } from '@prisma/client';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    const blueprint = await prisma.blueprint.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            _count: {
              select: {
                workOrders: true,
              },
            },
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
      },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: { message: 'Blueprint not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: blueprint });
  } catch (error) {
    console.error('Error fetching blueprint:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch blueprint', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const body = await request.json();

    const { name, description, status } = body;

    // Verify blueprint exists
    const existing = await prisma.blueprint.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Blueprint not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses: BlueprintStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: {
              message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
              code: 'VALIDATION_ERROR',
            },
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;

    const blueprint = await prisma.blueprint.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ data: blueprint });
  } catch (error) {
    console.error('Error updating blueprint:', error);
    return NextResponse.json(
      { error: { message: 'Failed to update blueprint', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
