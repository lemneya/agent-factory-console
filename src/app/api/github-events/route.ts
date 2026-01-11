import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import {
  parsePaginationParams,
  buildPrismaOptions,
  createPaginatedResponse,
} from '@/lib/api/pagination';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const eventType = searchParams.get('eventType');

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);

    const where = {
      project: { userId: user.id },
      ...(projectId && { projectId }),
      ...(eventType && { eventType }),
    };

    const [events, total] = await Promise.all([
      prisma.gitHubEvent.findMany({
        where,
        ...prismaOptions,
        orderBy: { receivedAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              repoName: true,
              repoFullName: true,
            },
          },
        },
      }),
      prisma.gitHubEvent.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(events, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching GitHub events:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const {
      projectId,
      eventType,
      action,
      payload,
      repositoryName,
      senderUsername,
      senderAvatarUrl,
    } = body;

    if (!eventType || !payload || !repositoryName || !senderUsername) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, payload, repositoryName, senderUsername' },
        { status: 400 }
      );
    }

    // Verify project belongs to user if projectId is provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      if (project.userId !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to add events to this project' },
          { status: 403 }
        );
      }
    }

    const event = await prisma.gitHubEvent.create({
      data: {
        projectId: projectId || null,
        eventType,
        action: action || null,
        repositoryName,
        senderUsername,
        senderAvatarUrl,
        payload,
      },
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating GitHub event:', error);
    return NextResponse.json({ error: 'Failed to create GitHub event' }, { status: 500 });
  }
}
