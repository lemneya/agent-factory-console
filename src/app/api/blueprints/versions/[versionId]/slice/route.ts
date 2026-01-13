/**
 * AFC-1.7: Blueprint Version Slice API
 *
 * POST /api/blueprints/versions/[versionId]/slice - Create WorkOrders from a version
 *
 * The Slicer is deterministic: same input → same keys/specHash/order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sliceBlueprintToWorkOrders, toWorkOrderCreateInput } from '@/lib/blueprint';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { versionId } = await params;
    const body = await request.json().catch(() => ({}));

    const { runId } = body;

    // Fetch the version with blueprint
    const version = await prisma.blueprintVersion.findUnique({
      where: { id: versionId },
      include: {
        blueprint: {
          select: {
            id: true,
            name: true,
            projectId: true,
            status: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: { message: 'Blueprint version not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Version must be published to slice
    if (!version.publishedAt) {
      return NextResponse.json(
        {
          error: { message: 'Version must be published before slicing', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      );
    }

    // Validate runId if provided
    if (runId) {
      const run = await prisma.run.findUnique({
        where: { id: runId },
      });
      if (!run) {
        return NextResponse.json(
          { error: { message: 'Run not found', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }
      if (run.projectId !== version.blueprint.projectId) {
        return NextResponse.json(
          {
            error: { message: 'Run does not belong to the same project', code: 'VALIDATION_ERROR' },
          },
          { status: 400 }
        );
      }
    }

    // Check if WorkOrders already exist for this version + runId combination
    const existingWorkOrders = await prisma.workOrder.findMany({
      where: {
        blueprintVersionId: versionId,
        runId: runId || null,
      },
    });

    if (existingWorkOrders.length > 0) {
      return NextResponse.json(
        {
          error: {
            message: 'WorkOrders already exist for this version' + (runId ? ' and run' : ''),
            code: 'VALIDATION_ERROR',
            existingCount: existingWorkOrders.length,
          },
        },
        { status: 400 }
      );
    }

    // Run the Slicer
    const slicerResult = sliceBlueprintToWorkOrders(version.specJson, {
      projectId: version.blueprint.projectId,
      runId,
    });

    if (slicerResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: {
            message: 'Slicer validation failed',
            code: 'VALIDATION_ERROR',
            details: slicerResult.errors,
          },
        },
        { status: 400 }
      );
    }

    // Create WorkOrders and dependencies in a transaction
    await prisma.$transaction(async tx => {
      // Create all WorkOrders first
      const workOrderMap = new Map<string, string>(); // key -> id

      const workOrders = [];
      for (const woData of slicerResult.workOrders) {
        const createInput = toWorkOrderCreateInput(
          woData,
          versionId,
          version.blueprint.projectId,
          runId
        );

        const workOrder = await tx.workOrder.create({
          data: createInput,
        });

        workOrderMap.set(woData.key, workOrder.id);
        workOrders.push(workOrder);
      }

      // Create dependencies
      for (const woData of slicerResult.workOrders) {
        const workOrderId = workOrderMap.get(woData.key);
        if (!workOrderId) continue;

        for (const depKey of woData.dependsOnKeys) {
          const dependsOnId = workOrderMap.get(depKey);
          if (!dependsOnId) continue;

          await tx.workOrderDependency.create({
            data: {
              workOrderId,
              dependsOnId,
            },
          });
        }
      }

      return workOrders;
    });

    // Fetch created WorkOrders with dependencies
    const workOrdersWithDeps = await prisma.workOrder.findMany({
      where: {
        blueprintVersionId: versionId,
        runId: runId || null,
      },
      include: {
        dependsOn: {
          include: {
            dependsOn: {
              select: {
                id: true,
                key: true,
                title: true,
                domain: true,
              },
            },
          },
        },
        _count: {
          select: {
            dependedOnBy: true,
          },
        },
      },
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({
      data: {
        specHash: slicerResult.specHash,
        workOrders: workOrdersWithDeps,
        totalCount: workOrdersWithDeps.length,
      },
      message: `Created ${workOrdersWithDeps.length} WorkOrders from blueprint version`,
    });
  } catch (error) {
    console.error('Error slicing blueprint version:', error);
    return NextResponse.json(
      { error: { message: 'Failed to slice blueprint version', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
