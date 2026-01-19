/**
 * AFC-RUNNER-UX-2: Blueprint Detail API
 *
 * GET /api/blueprints/[id] - Get blueprint details with work orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const blueprint = await prisma.blueprint.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            key: true,
            domain: true,
            title: true,
            spec: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // AFC-RUNNER-UX-3: Fetch project repo config if projectId exists
    let projectRepoConfig = null;
    if (blueprint.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: blueprint.projectId },
        select: {
          id: true,
          repoOwner: true,
          repoName: true,
          baseBranch: true,
        },
      });
      if (project && project.repoOwner && project.repoName) {
        projectRepoConfig = {
          repoOwner: project.repoOwner,
          repoName: project.repoName,
          baseBranch: project.baseBranch || 'main',
        };
      }
    }

    // Calculate status counts
    const statusCounts = blueprint.workOrders.reduce(
      (acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get pending work order IDs for batch execute
    const pendingWorkOrderIds = blueprint.workOrders
      .filter(wo => wo.status === 'PENDING')
      .map(wo => wo.id);

    return NextResponse.json({
      blueprint: {
        ...blueprint,
        statusCounts,
        pendingCount: statusCounts['PENDING'] || 0,
        pendingWorkOrderIds,
        projectRepoConfig, // AFC-RUNNER-UX-3: Include project repo config
      },
    });
  } catch (error) {
    console.error('Error fetching blueprint:', error);
    return NextResponse.json({ error: 'Failed to fetch blueprint' }, { status: 500 });
  }
}
