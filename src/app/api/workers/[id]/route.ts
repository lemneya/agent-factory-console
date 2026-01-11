import { NextRequest, NextResponse } from 'next/server';
import { getWorker, updateWorker, deregisterWorker } from '@/lib/workers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workers/[id]
 * Get a specific worker by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const worker = await getWorker(id);

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json({ worker });
  } catch (error) {
    console.error('Error fetching worker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workers/[id]
 * Update a worker
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, status, capabilities, metadata } = body;

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const worker = await updateWorker(id, {
      name,
      status,
      capabilities,
      metadata,
    });

    return NextResponse.json({ worker });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json(
      { error: 'Failed to update worker' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workers/[id]
 * Deregister a worker
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify worker exists
    const existingWorker = await getWorker(id);
    if (!existingWorker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    await deregisterWorker(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deregistering worker:', error);
    return NextResponse.json(
      { error: 'Failed to deregister worker' },
      { status: 500 }
    );
  }
}
