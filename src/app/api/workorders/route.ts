/**
 * GET /api/workorders
 *
 * AFC-RUNNER-0: List work orders with optional filtering
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
        ...(status && { status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' }),
      },
      orderBy: [
        { domain: 'asc' },
        { key: 'asc' },
      ],
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
    return NextResponse.json(
      { error: 'Failed to list work orders' },
      { status: 500 }
    );
  }
}
