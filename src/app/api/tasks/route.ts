import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import {
  parsePaginationParams,
  buildPrismaOptions,
  createPaginatedResponse,
  buildSortOptions,
} from '@/lib/api/pagination';
import { TaskStatus, TaskPriority } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const status = searchParams.get('status') as TaskStatus | null;
    const priority = searchParams.get('priority') as TaskPriority | null;
    const agentId = searchParams.get('agentId');
    const assignee = searchParams.get('assignee');

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);
    const orderBy = buildSortOptions(paginationParams.sortBy, paginationParams.sortOrder);

    const where = {
      run: { project: { userId: user.id } },
      ...(runId && { runId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(agentId && { agentId }),
      ...(assignee && { assignee }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        ...prismaOptions,
        orderBy,
        include: {
          run: {
            select: {
              id: true,
              name: true,
              status: true,
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
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(tasks, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const { runId, title, description, status, priority, agentId, assignee } = body;

    if (!runId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, title' },
        { status: 400 }
      );
    }

    // Verify run belongs to user's project
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (run.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to create tasks in this run' },
        { status: 403 }
      );
    }

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

    const task = await prisma.task.create({
      data: {
        runId,
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        agentId,
        assignee,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
