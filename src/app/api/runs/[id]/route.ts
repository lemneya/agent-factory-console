import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import { RunStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
            repoName: true,
            repoFullName: true,
            htmlUrl: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (run.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this run' },
        { status: 403 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error('Error fetching run:', error);
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingRun = await prisma.run.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingRun) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (existingRun.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this run' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, status, completedAt } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(RunStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const run = await prisma.run.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
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
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error('Error updating run:', error);
    return NextResponse.json({ error: 'Failed to update run' }, { status: 500 });
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

    const existingRun = await prisma.run.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingRun) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (existingRun.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this run' },
        { status: 403 }
      );
    }

    await prisma.run.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting run:', error);
    return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 });
  }
}
