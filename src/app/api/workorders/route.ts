/**
 * AFC-1.7: WorkOrders API Routes
 *
 * GET /api/workorders?projectId=...&runId=...&status=...&domain=... - List WorkOrders
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkOrderDomain, WorkOrderStatus } from '@prisma/client';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('projectId');
    const runId = searchParams.get('runId');
    const status = searchParams.get('status') as WorkOrderStatus | null;
    const domain = searchParams.get('domain') as WorkOrderDomain | null;
    const blueprintVersionId = searchParams.get('blueprintVersionId');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (projectId) where.projectId = projectId;
    if (runId) where.runId = runId;
    if (status) where.status = status;
    if (domain) where.domain = domain;
    if (blueprintVersionId) where.blueprintVersionId = blueprintVersionId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        blueprintVersion: {
          select: {
            id: true,
            version: true,
            specHash: true,
            blueprint: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        run: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        dependsOn: {
          include: {
            dependsOn: {
              select: {
                id: true,
                key: true,
                title: true,
                domain: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            dependedOnBy: true,
            tasks: true,
            auditEvents: true,
          },
        },
      },
      orderBy: [{ key: 'asc' }],
    });

    // Transform to include dependency count
    const transformed = workOrders.map(wo => ({
      ...wo,
      dependsOnCount: wo.dependsOn.length,
      dependedOnByCount: wo._count.dependedOnBy,
      specCount: Array.isArray(wo.specIds) ? wo.specIds.length : 0,
    }));

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error('Error fetching workorders:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch workorders', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
