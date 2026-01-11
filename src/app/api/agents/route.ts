import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';
import {
  parsePaginationParams,
  buildPrismaOptions,
  createPaginatedResponse,
  buildSortOptions,
} from '@/lib/api/pagination';
import { AgentType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AgentType | null;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === null ? undefined : isActiveParam === 'true';

    const paginationParams = parsePaginationParams(request);
    const prismaOptions = buildPrismaOptions(paginationParams);
    const orderBy = buildSortOptions(paginationParams.sortBy, paginationParams.sortOrder);

    const where = {
      userId: user.id,
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        ...prismaOptions,
        orderBy,
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.agent.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(agents, paginationParams, total)
    );
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await request.json();
    const { name, type, description, avatarUrl } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Validate agent type
    const validTypes = Object.values(AgentType);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid agent type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if agent with same name already exists for this user
    const existingAgent = await prisma.agent.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An agent with this name already exists' },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name,
        type,
        description,
        avatarUrl,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
