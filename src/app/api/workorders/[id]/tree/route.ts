/**
 * AFC-1.7: WorkOrder Dependency Tree API
 *
 * GET /api/workorders/[id]/tree - Get dependency tree for a WorkOrder
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

interface TreeNode {
  id: string;
  key: string;
  title: string;
  domain: string;
  status: string;
  dependsOn: TreeNode[];
  dependedOnBy: TreeNode[];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    // Fetch the WorkOrder
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        title: true,
        domain: true,
        status: true,
        blueprintVersionId: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: { message: 'WorkOrder not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Fetch all WorkOrders for this blueprint version to build the tree
    const allWorkOrders = await prisma.workOrder.findMany({
      where: { blueprintVersionId: workOrder.blueprintVersionId },
      select: {
        id: true,
        key: true,
        title: true,
        domain: true,
        status: true,
      },
    });

    // Fetch all dependencies
    const allDependencies = await prisma.workOrderDependency.findMany({
      where: {
        workOrder: { blueprintVersionId: workOrder.blueprintVersionId },
      },
      select: {
        workOrderId: true,
        dependsOnId: true,
      },
    });

    // Build lookup maps
    const workOrderMap = new Map(allWorkOrders.map(wo => [wo.id, wo]));
    const dependsOnMap = new Map<string, string[]>();
    const dependedOnByMap = new Map<string, string[]>();

    for (const dep of allDependencies) {
      // dependsOn: workOrderId depends on dependsOnId
      if (!dependsOnMap.has(dep.workOrderId)) {
        dependsOnMap.set(dep.workOrderId, []);
      }
      dependsOnMap.get(dep.workOrderId)!.push(dep.dependsOnId);

      // dependedOnBy: dependsOnId is depended on by workOrderId
      if (!dependedOnByMap.has(dep.dependsOnId)) {
        dependedOnByMap.set(dep.dependsOnId, []);
      }
      dependedOnByMap.get(dep.dependsOnId)!.push(dep.workOrderId);
    }

    // Build tree recursively (with depth limit to prevent infinite loops)
    function buildDependsOnTree(woId: string, visited: Set<string>, depth: number): TreeNode[] {
      if (depth > 10 || visited.has(woId)) return [];
      visited.add(woId);

      const depIds = dependsOnMap.get(woId) || [];
      return depIds
        .map(depId => {
          const wo = workOrderMap.get(depId);
          if (!wo) return null;
          return {
            id: wo.id,
            key: wo.key,
            title: wo.title,
            domain: wo.domain,
            status: wo.status,
            dependsOn: buildDependsOnTree(depId, new Set(visited), depth + 1),
            dependedOnBy: [],
          };
        })
        .filter(Boolean) as TreeNode[];
    }

    function buildDependedOnByTree(woId: string, visited: Set<string>, depth: number): TreeNode[] {
      if (depth > 10 || visited.has(woId)) return [];
      visited.add(woId);

      const depIds = dependedOnByMap.get(woId) || [];
      return depIds
        .map(depId => {
          const wo = workOrderMap.get(depId);
          if (!wo) return null;
          return {
            id: wo.id,
            key: wo.key,
            title: wo.title,
            domain: wo.domain,
            status: wo.status,
            dependsOn: [],
            dependedOnBy: buildDependedOnByTree(depId, new Set(visited), depth + 1),
          };
        })
        .filter(Boolean) as TreeNode[];
    }

    const tree: TreeNode = {
      id: workOrder.id,
      key: workOrder.key,
      title: workOrder.title,
      domain: workOrder.domain,
      status: workOrder.status,
      dependsOn: buildDependsOnTree(workOrder.id, new Set(), 0),
      dependedOnBy: buildDependedOnByTree(workOrder.id, new Set(), 0),
    };

    // Also return flat list of all WorkOrders for visualization
    const flatList = allWorkOrders.map(wo => ({
      ...wo,
      dependsOn: dependsOnMap.get(wo.id) || [],
      dependedOnBy: dependedOnByMap.get(wo.id) || [],
    }));

    return NextResponse.json({
      data: {
        tree,
        flatList,
        totalCount: allWorkOrders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching workorder tree:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch workorder tree', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
