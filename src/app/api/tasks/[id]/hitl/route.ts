import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
      isBlocked: task.status === 'BLOCKED',
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
  try {
    const { id } = await params;
    const body = await request.json();
    const { hitl, blockedReason, status } = body;

    // Validate task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Prisma.TaskUpdateInput = {};

    if (hitl !== undefined) {
      updateData.hitlJson = hitl as Prisma.InputJsonValue;
    }

    if (blockedReason !== undefined) {
      updateData.blockedReason = blockedReason;
    }

    // If setting HITL data with a reason, also set status to BLOCKED
    if (status) {
      updateData.status = status;
    } else if (blockedReason && !status) {
      updateData.status = 'BLOCKED';
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
      isBlocked: updatedTask.status === 'BLOCKED',
    });
  } catch (error) {
    console.error('Error updating task HITL state:', error);
    return NextResponse.json(
      { error: 'Failed to update HITL state' },
      { status: 500 }
    );
  }
}
