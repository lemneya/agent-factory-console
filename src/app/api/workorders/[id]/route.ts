/**
 * AFC-1.7: WorkOrder Detail API Routes
 *
 * GET /api/workorders/[id] - Get WorkOrder details
 * PATCH /api/workorders/[id] - Update WorkOrder status (with audit trail)
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkOrderStatus } from '@prisma/client';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PLANNED: ['READY', 'BLOCKED', 'ABORTED'],
  READY: ['IN_PROGRESS', 'BLOCKED', 'ABORTED'],
  BLOCKED: ['READY', 'ABORTED'],
  IN_PROGRESS: ['WAITING_FOR_APPROVAL', 'DONE', 'BLOCKED', 'ABORTED'],
  WAITING_FOR_APPROVAL: ['IN_PROGRESS', 'DONE', 'ABORTED'],
  DONE: [], // Terminal state
  ABORTED: [], // Terminal state
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        blueprintVersion: {
          select: {
            id: true,
            version: true,
            specHash: true,
            specJson: true,
            publishedAt: true,
            blueprint: {
              select: {
                id: true,
                name: true,
                projectId: true,
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
        dependedOnBy: {
          include: {
            workOrder: {
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
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: { message: 'WorkOrder not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: workOrder });
  } catch (error) {
    console.error('Error fetching workorder:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch workorder', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const body = await request.json();

    const { status, reason, actor } = body;

    // Fetch existing WorkOrder
    const existing = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'WorkOrder not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Validate status transition
    if (status !== undefined) {
      const validStatuses = Object.keys(VALID_TRANSITIONS) as WorkOrderStatus[];
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

      const currentStatus = existing.status as WorkOrderStatus;
      const allowedTransitions = VALID_TRANSITIONS[currentStatus];

      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            error: {
              message: `Invalid status transition from ${currentStatus} to ${status}. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
              code: 'VALIDATION_ERROR',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update WorkOrder and create audit event in transaction
    await prisma.$transaction(async (tx) => {
      // Update WorkOrder
      const updated = await tx.workOrder.update({
        where: { id },
        data: { status },
      });

      // Create audit event
      if (status !== undefined && status !== existing.status) {
        await tx.workOrderAuditEvent.create({
          data: {
            workOrderId: id,
            actor: actor || null,
            fromStatus: existing.status as WorkOrderStatus,
            toStatus: status,
            reason: reason || null,
          },
        });
      }

      return updated;
    });

    // Fetch updated WorkOrder with relations
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        auditEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({
      data: workOrder,
      message: `WorkOrder status updated from ${existing.status} to ${status}`,
    });
  } catch (error) {
    console.error('Error updating workorder:', error);
    return NextResponse.json(
      { error: { message: 'Failed to update workorder', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
