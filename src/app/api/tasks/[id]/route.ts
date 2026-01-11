import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import { TaskStatus, TaskPriority } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            status: true,
            project: {
              select: {
                id: true,
                userId: true,
                repoName: true,
                repoFullName: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.run.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this task' },
        { status: 403 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        run: {
          include: {
            project: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (existingTask.run.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this task' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, agentId, assignee } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = Object.values(TaskPriority);
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate agent if provided
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      if (agent.userId !== user.id) {
        return NextResponse.json(
          { error: 'You can only assign your own agents to tasks' },
          { status: 403 }
        );
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(agentId !== undefined && { agentId }),
        ...(assignee !== undefined && { assignee }),
      },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                repoName: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// Also support PUT for backwards compatibility
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return PATCH(request, { params });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        run: {
          include: {
            project: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (existingTask.run.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this task' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
