import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOwnership } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        runs: {
          include: {
            tasks: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { receivedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { runs: true, events: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(project.userId, user.id);
    if (ownershipError) return ownershipError;

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(existingProject.userId, user.id);
    if (ownershipError) return ownershipError;

    const body = await request.json();
    const { repoName, repoFullName, description, htmlUrl, lastUpdated } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(repoName !== undefined && { repoName }),
        ...(repoFullName !== undefined && { repoFullName }),
        ...(description !== undefined && { description }),
        ...(htmlUrl !== undefined && { htmlUrl }),
        ...(lastUpdated !== undefined && { lastUpdated: new Date(lastUpdated) }),
      },
      include: {
        _count: {
          select: { runs: true, events: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(existingProject.userId, user.id);
    if (ownershipError) return ownershipError;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
