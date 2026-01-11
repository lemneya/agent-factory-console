import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');

    const tasks = await prisma.task.findMany({
      where: {
        ...(runId && { runId }),
        ...(status && { status }),
        ...(assignee && { assignee }),
      },
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
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, title, status, assignee } = body;

    if (!runId || !title) {
      return NextResponse.json({ error: 'Missing required fields: runId, title' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        runId,
        title,
        status: status || 'TODO',
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
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
