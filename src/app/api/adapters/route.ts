/**
 * AFC-ADAPTER-2: Adapter Registry API
 * GET /api/adapters - List all registered adapters
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    const adapters = await prisma.adapter.findMany({
      where: enabledOnly ? { enabled: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(adapters);
  } catch (error) {
    console.error('Error fetching adapters:', error);
    return NextResponse.json({ error: 'Failed to fetch adapters' }, { status: 500 });
  }
}
