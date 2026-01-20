/**
 * AFC-ADAPTER-2: Adapter Registry API
 * GET /api/adapters/:id - Get single adapter by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const adapter = await prisma.adapter.findUnique({
      where: { id },
    });

    if (!adapter) {
      return NextResponse.json({ error: 'Adapter not found' }, { status: 404 });
    }

    return NextResponse.json(adapter);
  } catch (error) {
    console.error('Error fetching adapter:', error);
    return NextResponse.json({ error: 'Failed to fetch adapter' }, { status: 500 });
  }
}
