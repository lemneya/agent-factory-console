/**
 * AFC-C2-STREAM-0: Stop Swarm Simulation
 *
 * POST /api/c2/sessions/:id/simulate/stop - Stop the running simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireC2SessionOwnership } from '@/lib/auth-helpers';
import { stopSimulation, isSimulationRunning } from '@/lib/c2-simulation';

/**
 * POST /api/c2/sessions/:id/simulate/stop
 * Stop a running swarm simulation
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
    // Check if simulation is running
    if (!isSimulationRunning(sessionId)) {
      return NextResponse.json(
        { error: 'No simulation running for this session' },
        { status: 404 }
      );
    }

    // Stop the simulation
    await stopSimulation(sessionId);

    return NextResponse.json({
      message: 'Simulation stopped',
      sessionId,
      status: 'ABORTED',
    });
  } catch (error) {
    console.error('[C2 Simulate Stop] POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to stop simulation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
