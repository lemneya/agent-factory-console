import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const event = await prisma.gitHubEvent.findUnique({
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
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'GitHub event not found' }, { status: 404 });
    }

    // Check ownership through project
    if (event.project && event.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this event' },
        { status: 403 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching GitHub event:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const event = await prisma.gitHubEvent.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'GitHub event not found' }, { status: 404 });
    }

    // Check ownership through project
    if (event.project && event.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }

    await prisma.gitHubEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting GitHub event:', error);
    return NextResponse.json({ error: 'Failed to delete GitHub event' }, { status: 500 });
  }
}
