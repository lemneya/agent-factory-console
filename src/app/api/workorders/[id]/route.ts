/**
 * GET /api/workorders/[id]
 * PATCH /api/workorders/[id]
 *
 * AFC-RUNNER-0: WorkOrder detail and update endpoints
 *
 * SECURITY-0: Write operations require authentication.
 * WorkOrders with a project association require ownership verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireWorkOrderOwnership } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        blueprint: true,
        blueprintVersion: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json({ workOrder });
  } catch (error) {
    console.error('Error getting work order:', error);
    return NextResponse.json({ error: 'Failed to get work order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via blueprint -> project chain if exists)
    const ownershipResult = await requireWorkOrderOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();

    // Only allow updating status and runId
    const allowedFields = ['status', 'runId'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ workOrder });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
  }
}
