import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/[id]/hitl/unblock
 * Unblock a task that was blocked for HITL
 * This moves the task back to DOING status and signals to the worker to continue
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { clearHitl = false, newStatus = 'DOING' } = body;

    // Validate newStatus
    const validStatuses = ['TODO', 'DOING', 'DONE'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        hitlJson: true,
        blockedReason: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'BLOCKED') {
      return NextResponse.json(
        { error: 'Task is not blocked' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Prisma.TaskUpdateInput = {
      status: newStatus,
      blockedReason: null,
    };

    // Optionally clear HITL data (default: preserve it for audit trail)
    if (clearHitl) {
      updateData.hitlJson = Prisma.DbNull;
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
      isBlocked: false,
      message: 'Task unblocked successfully',
    });
  } catch (error) {
    console.error('Error unblocking task:', error);
    return NextResponse.json(
      { error: 'Failed to unblock task' },
      { status: 500 }
    );
  }
}
