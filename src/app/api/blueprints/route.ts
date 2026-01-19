/**
 * AFC-RUNNER-UX-2: Blueprints API
 *
 * GET /api/blueprints - List all blueprints with work order counts
 * POST /api/blueprints - Create a new blueprint (for seeding/testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const blueprints = await prisma.blueprint.findMany({
      include: {
        workOrders: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include status counts
    const blueprintsWithCounts = blueprints.map(bp => {
      const statusCounts = bp.workOrders.reduce(
        (acc, wo) => {
          acc[wo.status] = (acc[wo.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        id: bp.id,
        name: bp.name,
        description: bp.description,
        projectId: bp.projectId,
        createdAt: bp.createdAt,
        updatedAt: bp.updatedAt,
        workOrderCount: bp._count.workOrders,
        statusCounts,
        pendingCount: statusCounts['PENDING'] || 0,
      };
    });

    return NextResponse.json({ blueprints: blueprintsWithCounts });
  } catch (error) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json({ error: 'Failed to fetch blueprints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Guard: Only allow in test/CI/dev environments
  const allowSeed =
    process.env.NODE_ENV === 'test' ||
    process.env.CI === 'true' ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  if (!allowSeed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, projectId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const blueprint = await prisma.blueprint.create({
      data: {
        name,
        description,
        projectId,
      },
    });

    return NextResponse.json({ blueprint }, { status: 201 });
  } catch (error) {
    console.error('Error creating blueprint:', error);
    return NextResponse.json({ error: 'Failed to create blueprint' }, { status: 500 });
  }
}
