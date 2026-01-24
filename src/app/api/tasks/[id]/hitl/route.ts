/**
 * GET/PUT /api/tasks/[id]/hitl
 *
 * SECURITY-0: All operations require authentication and ownership verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTaskOwnership, isDemoMode } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/hitl
 * Get the HITL state for a task
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // DEMO_MODE: Allow read access without auth
    if (!isDemoMode()) {
      // SECURITY-0: Require authentication
      const authResult = await requireAuth();
      if (authResult.error) return authResult.error;
      const { userId } = authResult;

      // SECURITY-0: Verify ownership (via run -> project chain)
      const ownershipResult = await requireTaskOwnership(id, userId);
      if (ownershipResult.error) return ownershipResult.error;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        hitlJson: true,
        blockedReason: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      taskId: task.id,
      title: task.title,
      status: task.status,
      hitl: task.hitlJson,
      blockedReason: task.blockedReason,
      isBlocked: task.status === 'BLOCKED_HITL',
    });
  } catch (error) {
    console.error('Error fetching task HITL state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HITL state' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]/hitl
 * Update the HITL state for a task (used by workers to set questions/patches)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // DEMO_MODE: Block writes in demo environment
  if (process.env.DEMO_MODE === '1') {
    return NextResponse.json({ error: 'Demo mode: writes disabled' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via run -> project chain)
    const ownershipResult = await requireTaskOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { hitl, blockedReason, status } = body;

    // Build update data
    const updateData: Prisma.TaskUpdateInput = {};

    if (hitl !== undefined) {
      updateData.hitlJson = hitl as Prisma.InputJsonValue;
    }

    if (blockedReason !== undefined) {
      updateData.blockedReason = blockedReason;
    }

    // If setting HITL data with a reason, also set status to BLOCKED_HITL
    if (status) {
      updateData.status = status;
    } else if (blockedReason && !status) {
      updateData.status = 'BLOCKED_HITL';
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        hitlJson: true,
        blockedReason: true,
      },
    });

    return NextResponse.json({
      taskId: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      hitl: updatedTask.hitlJson,
      blockedReason: updatedTask.blockedReason,
      isBlocked: updatedTask.status === 'BLOCKED_HITL',
    });
  } catch (error) {
    console.error('Error updating task HITL state:', error);
    return NextResponse.json(
      { error: 'Failed to update HITL state' },
      { status: 500 }
    );
  }
}
