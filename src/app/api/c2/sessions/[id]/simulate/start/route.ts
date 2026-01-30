/**
 * AFC-C2-STREAM-0: Start Swarm Simulation
 *
 * POST /api/c2/sessions/:id/simulate/start - Start the deterministic 30s simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireC2SessionOwnership } from '@/lib/auth-helpers';
import { startSimulation, isSimulationRunning } from '@/lib/c2-simulation';

/**
 * POST /api/c2/sessions/:id/simulate/start
 * Start a deterministic swarm simulation for the session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  const { id: sessionId } = await params;

  // Check ownership
  const ownershipResult = await requireC2SessionOwnership(sessionId, userId);
  if (ownershipResult.error) return ownershipResult.error;

  try {
    // Check if session exists
    const session = await prisma.c2Session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if already running
    if (isSimulationRunning(sessionId)) {
      return NextResponse.json(
        { error: 'Simulation already running' },
        { status: 409 }
      );
    }

    // Check if session is in a valid state to start
    if (session.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Session is already running' },
        { status: 409 }
      );
    }

    // Start the simulation
    await startSimulation(sessionId);

    return NextResponse.json({
      message: 'Simulation started',
      sessionId,
      status: 'RUNNING',
    });
  } catch (error) {
    console.error('[C2 Simulate Start] POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to start simulation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
