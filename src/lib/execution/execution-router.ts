/**
 * AFC-KIMI-ROUTER-0: Execution Router
 *
 * Controls Kimi execution with strict budgets and constraints.
 * Only invokes Kimi for the true delta identified by build routing.
 *
 * NOTE: This gate does NOT allow autonomous execution.
 */

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { executeKimi, validateExecutionParams, type KimiExecutionResult } from './kimi-adapter';

// ============================================================================
// Types
// ============================================================================

export interface ExecutionRequest {
  buildPlanId: string;
  userId: string;
  sessionId?: string;
}

export interface ExecutionResponse {
  executionEnvelopeId: string;
  executionRunId: string;
  status: string;
  maxCostUSD: number;
  maxAgents: number;
  maxRuntimeSec: number;
  result?: KimiExecutionResult;
}

export interface BuildPlanDetails {
  requiresKimi?: boolean;
  uncoveredFeatures?: string[];
  [key: string]: unknown;
}

// ============================================================================
// Budget Defaults (Conservative)
// ============================================================================

export const DEFAULT_MAX_COST_USD = 25;
export const DEFAULT_MAX_AGENTS = 5;
export const DEFAULT_MAX_RUNTIME_SEC = 600; // 10 minutes
export const DEFAULT_ALLOWED_SCOPES = ['custom_logic', 'integration_glue'];

// ============================================================================
// Eligibility Rules (Authoritative)
// ============================================================================

/**
 * Check if a build plan requires Kimi execution.
 *
 * Kimi execution is allowed ONLY if:
 * - BuildPlan.strategy === "CUSTOM"
 * - OR BuildPlan.details.requiresKimi === true
 */
export function requiresExecution(strategy: string, details: BuildPlanDetails): boolean {
  if (strategy === 'CUSTOM') {
    return true;
  }
  if (details.requiresKimi === true) {
    return true;
  }
  return false;
}

// ============================================================================
// Execution Router
// ============================================================================

/**
 * Execute Kimi for a build plan with budget constraints.
 *
 * Steps:
 * 1) Load BuildPlan and verify ownership
 * 2) Check eligibility rules
 * 3) Create ExecutionEnvelope (PENDING)
 * 4) Transition envelope → RUNNING
 * 5) Call kimi-adapter with constraints
 * 6) Track runtime, tokens, cost
 * 7) Persist ExecutionRun
 * 8) Update envelope status
 */
export async function runExecution(
  request: ExecutionRequest
): Promise<
  { success: true; response: ExecutionResponse } | { success: false; error: string; status: number }
> {
  const { buildPlanId, userId, sessionId } = request;

  // 1) Load BuildPlan and verify ownership
  const buildPlan = await prisma.buildPlan.findFirst({
    where: { id: buildPlanId, userId },
  });

  if (!buildPlan) {
    return {
      success: false,
      error: 'Build plan not found or not owned by user',
      status: 404,
    };
  }

  const details = buildPlan.details as unknown as BuildPlanDetails;

  // 2) Check eligibility rules
  if (!requiresExecution(buildPlan.strategy, details)) {
    return {
      success: false,
      error: 'No execution required (reuse sufficient)',
      status: 400,
    };
  }

  // 3) Validate sessionId ownership if provided
  let validatedSessionId: string | null = null;
  if (sessionId) {
    // User explicitly provided sessionId - must verify ownership
    const session = await prisma.c2Session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      return {
        success: false,
        error: 'Session not found or not owned by user',
        status: 403,
      };
    }
    validatedSessionId = session.id;
  } else if (buildPlan.sessionId) {
    // Use buildPlan's session (already owned because buildPlan is owned)
    validatedSessionId = buildPlan.sessionId;
  }

  // 4) Create ExecutionEnvelope (PENDING)
  const envelope = await prisma.executionEnvelope.create({
    data: {
      userId,
      buildPlanId,
      provider: 'kimi',
      maxCostUSD: DEFAULT_MAX_COST_USD,
      maxAgents: DEFAULT_MAX_AGENTS,
      maxRuntimeSec: DEFAULT_MAX_RUNTIME_SEC,
      allowedScopes: DEFAULT_ALLOWED_SCOPES as unknown as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  });

  // Log C2 event if validated session exists
  if (validatedSessionId) {
    await logC2Event(
      validatedSessionId,
      `Kimi execution started (budget $${DEFAULT_MAX_COST_USD}, agents ${DEFAULT_MAX_AGENTS})`
    );
  }

  // 5) Transition envelope → RUNNING
  await prisma.executionEnvelope.update({
    where: { id: envelope.id },
    data: { status: 'RUNNING' },
  });

  // 6) Create KimiExecutionRun
  const run = await prisma.kimiExecutionRun.create({
    data: {
      envelopeId: envelope.id,
      provider: 'kimi',
      startedAt: new Date(),
      status: 'RUNNING',
    },
  });

  // 7) Validate and execute
  const execParams = {
    maxCostUSD: DEFAULT_MAX_COST_USD,
    maxAgents: DEFAULT_MAX_AGENTS,
    maxRuntimeSec: DEFAULT_MAX_RUNTIME_SEC,
    allowedScopes: DEFAULT_ALLOWED_SCOPES,
    uncoveredFeatures: (details.uncoveredFeatures as string[]) || [],
  };

  const validation = validateExecutionParams(execParams);
  if (!validation.valid) {
    await prisma.kimiExecutionRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        summary: `Validation failed: ${validation.error}`,
      },
    });
    await prisma.executionEnvelope.update({
      where: { id: envelope.id },
      data: { status: 'FAILED' },
    });
    return {
      success: false,
      error: `Validation failed: ${validation.error}`,
      status: 400,
    };
  }

  // 8) Execute Kimi (stub)
  const result = await executeKimi(execParams);

  // 9) Update KimiExecutionRun
  await prisma.kimiExecutionRun.update({
    where: { id: run.id },
    data: {
      status: result.status,
      finishedAt: new Date(),
      tokensUsed: result.tokensUsed,
      costUSD: result.costUSD,
      summary: result.summary,
    },
  });

  // 9) Update envelope status
  const envelopeStatus = result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
  await prisma.executionEnvelope.update({
    where: { id: envelope.id },
    data: { status: envelopeStatus },
  });

  // Log C2 completion event (using validated session)
  if (validatedSessionId) {
    if (result.status === 'COMPLETED') {
      await logC2Event(
        validatedSessionId,
        `Kimi execution completed (cost $${result.costUSD.toFixed(2)})`
      );
    } else {
      await logC2Event(
        validatedSessionId,
        `Kimi execution aborted (${result.failureReason || 'unknown'})`
      );
    }
  }

  return {
    success: true,
    response: {
      executionEnvelopeId: envelope.id,
      executionRunId: run.id,
      status: envelopeStatus,
      maxCostUSD: DEFAULT_MAX_COST_USD,
      maxAgents: DEFAULT_MAX_AGENTS,
      maxRuntimeSec: DEFAULT_MAX_RUNTIME_SEC,
      result,
    },
  };
}

// ============================================================================
// C2 Integration
// ============================================================================

async function logC2Event(sessionId: string, message: string): Promise<void> {
  try {
    await prisma.c2Event.create({
      data: {
        sessionId,
        type: 'LOG',
        payload: { message } as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    // Log but don't fail execution for C2 errors
    console.error('[Execution] Failed to log C2 event:', error);
  }
}
