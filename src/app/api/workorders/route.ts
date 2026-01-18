/**
 * GET /api/workorders - List work orders with optional filtering
 * POST /api/workorders - Create a new work order (for E2E testing)
 *
 * AFC-RUNNER-0: WorkOrder management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprintId') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const workOrders = await prisma.workOrder.findMany({
      where: {
        ...(blueprintId && { blueprintId }),
        ...(status && {
          status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED',
        }),
      },
      orderBy: [{ domain: 'asc' }, { key: 'asc' }],
      take: limit,
      include: {
        blueprint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Error listing work orders:', error);
    return NextResponse.json({ error: 'Failed to list work orders' }, { status: 500 });
  }
}

interface CreateWorkOrderBody {
  key: string;
  domain: string;
  title: string;
  spec?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  blueprintId?: string;
  dependsOn?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateWorkOrderBody = await request.json();

    // Validate required fields
    if (!body.key || !body.domain || !body.title) {
      return NextResponse.json({ error: 'key, domain, and title are required' }, { status: 400 });
    }

    // Create the work order
    const workOrder = await prisma.workOrder.create({
      data: {
        key: body.key,
        domain: body.domain,
        title: body.title,
        spec: body.spec || null,
        status: body.status || 'PENDING',
        blueprintId: body.blueprintId || null,
        dependsOn: body.dependsOn || [],
      },
      include: {
        blueprint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
