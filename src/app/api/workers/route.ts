import { NextRequest, NextResponse } from 'next/server';
import { registerWorker, getWorkers } from '@/lib/workers';

/**
 * GET /api/workers
 * List all registered workers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeOffline = searchParams.get('includeOffline') === 'true';

    const workers = await getWorkers(includeOffline);

    return NextResponse.json({ workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

/**
 * POST /api/workers
 * Register a new worker
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, capabilities, metadata } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    const worker = await registerWorker({
      name,
      type,
      capabilities,
      metadata,
    });

    return NextResponse.json({ worker }, { status: 201 });
  } catch (error) {
    console.error('Error registering worker:', error);
    return NextResponse.json({ error: 'Failed to register worker' }, { status: 500 });
  }
}
