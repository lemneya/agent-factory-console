import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOwnership } from '@/lib/api/auth';
import { AgentType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 50,
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
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(agent.userId, user.id);
    if (ownershipError) return ownershipError;

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(existingAgent.userId, user.id);
    if (ownershipError) return ownershipError;

    const body = await request.json();
    const { name, type, description, avatarUrl, isActive } = body;

    // Validate agent type if provided
    if (type) {
      const validTypes = Object.values(AgentType);
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid agent type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check for name uniqueness if changing name
    if (name && name !== existingAgent.name) {
      const duplicateAgent = await prisma.agent.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name,
          },
        },
      });

      if (duplicateAgent) {
        return NextResponse.json(
          { error: 'An agent with this name already exists' },
          { status: 409 }
        );
      }
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { id } = await params;

    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const ownershipError = checkOwnership(existingAgent.userId, user.id);
    if (ownershipError) return ownershipError;

    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
