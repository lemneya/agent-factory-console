import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const runs = await prisma.run.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status }),
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, status } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    // AFC-1.1: Create run first, then set threadId = id (threadId binding rule)
    const run = await prisma.run.create({
      data: {
        projectId,
        name,
        status: status || 'ACTIVE',
        threadId: '', // Placeholder, will be updated
      },
    });

    // AFC-1.1: threadId MUST equal runId always
    const updatedRun = await prisma.run.update({
      where: { id: run.id },
      data: { threadId: run.id },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRun, { status: 201 });
  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });
  }
}
