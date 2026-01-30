/**
 * AFC-KIMI-ROUTER-0: Kimi Execution API
 *
 * POST /api/execution/kimi/run - Execute Kimi for a build plan
 *
 * INTERNAL USE ONLY - Does not allow autonomous execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { runExecution } from '@/lib/execution';

// ============================================================================
// Request Validation (Strict Schema)
// ============================================================================

const ALLOWED_FIELDS = ['buildPlanId', 'sessionId'];

function validateRequest(
  body: unknown
): { valid: true; buildPlanId: string; sessionId?: string } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const obj = body as Record<string, unknown>;

  // Reject extra fields
  const extraFields = Object.keys(obj).filter(k => !ALLOWED_FIELDS.includes(k));
  if (extraFields.length > 0) {
    return { valid: false, error: `Extra fields not allowed: ${extraFields.join(', ')}` };
  }

  // Validate buildPlanId (required)
  if (!obj.buildPlanId) {
    return { valid: false, error: 'buildPlanId is required' };
  }
  if (typeof obj.buildPlanId !== 'string') {
    return { valid: false, error: 'buildPlanId must be a string' };
  }

  // Validate sessionId (optional)
  if (obj.sessionId !== undefined && typeof obj.sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string' };
  }

  return {
    valid: true,
    buildPlanId: obj.buildPlanId,
    sessionId: obj.sessionId as string | undefined,
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { buildPlanId, sessionId } = validation;

  const result = await runExecution({
    buildPlanId,
    userId,
    sessionId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      executionEnvelopeId: result.response.executionEnvelopeId,
      executionRunId: result.response.executionRunId,
      status: result.response.status,
      maxCostUSD: result.response.maxCostUSD,
      maxAgents: result.response.maxAgents,
      maxRuntimeSec: result.response.maxRuntimeSec,
      result: result.response.result,
    },
    { status: 201 }
  );
}
