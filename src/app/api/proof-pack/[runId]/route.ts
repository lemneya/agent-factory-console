import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * AFC-PROOFPACK-0: Proof Pack Retrieval API
 *
 * GET /api/proof-pack/[runId] - Retrieve proof pack for a run
 *
 * Currently stubbed. Full implementation with DB persistence
 * will come in a future gate.
 */

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  // 1) Authenticate
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { userId } = auth;
  const { runId } = await params;

  // Validate runId format
  if (!runId || typeof runId !== 'string') {
    return NextResponse.json({ error: 'runId_required' }, { status: 400 });
  }

  // STUB: Return placeholder response
  // TODO: Replace with DB fetch in future gate (AFC-PROOFPACK-PERSIST-0)
  return NextResponse.json(
    {
      message: 'Proof pack retrieval stub',
      runId,
      tenantId: userId,
      note: 'Full implementation pending AFC-PROOFPACK-PERSIST-0',
    },
    { status: 200 }
  );
}
