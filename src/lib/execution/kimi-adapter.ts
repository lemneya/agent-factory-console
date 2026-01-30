/**
 * AFC-KIMI-ROUTER-0: Kimi Execution Adapter (Stub)
 *
 * Simulates Kimi execution for testing without real API calls.
 * Respects budget constraints: maxAgents, maxRuntimeSec, maxCostUSD.
 *
 * NOTE: This gate does NOT allow autonomous execution.
 */

// ============================================================================
// Types
// ============================================================================

export interface KimiExecutionParams {
  maxCostUSD: number;
  maxAgents: number;
  maxRuntimeSec: number;
  allowedScopes: string[];
  uncoveredFeatures: string[];
}

export interface KimiExecutionResult {
  tokensUsed: number;
  costUSD: number;
  summary: string;
  status: 'COMPLETED' | 'FAILED';
  runtimeSec: number;
  failureReason?: string;
}

// ============================================================================
// Cost Model (Simulated)
// ============================================================================

// Simulated cost per 1000 tokens (USD)
const COST_PER_1K_TOKENS = 0.002;

// Simulated tokens per feature
const TOKENS_PER_FEATURE = 5000;

// Simulated tokens per agent per second
const TOKENS_PER_AGENT_SEC = 100;

// ============================================================================
// Kimi Adapter (Stub Implementation)
// ============================================================================

/**
 * Simulate Kimi execution with budget constraints.
 *
 * This is a STUB - no real Kimi API calls.
 * Returns simulated results based on input parameters.
 */
export async function executeKimi(params: KimiExecutionParams): Promise<KimiExecutionResult> {
  const { maxCostUSD, maxAgents, maxRuntimeSec, uncoveredFeatures } = params;

  // Calculate simulated execution based on features
  const featureCount = uncoveredFeatures.length || 1;

  // Simulate token usage based on features and agents
  const baseTokens = featureCount * TOKENS_PER_FEATURE;

  // Simulate runtime (10-30 seconds per feature, distributed across agents)
  const baseRuntimeSec = Math.ceil((featureCount * 20) / Math.max(1, maxAgents));
  const actualRuntimeSec = Math.min(baseRuntimeSec, maxRuntimeSec);

  // Calculate tokens used during runtime
  const runtimeTokens = actualRuntimeSec * maxAgents * TOKENS_PER_AGENT_SEC;
  const totalTokens = baseTokens + runtimeTokens;

  // Calculate cost
  const costUSD = (totalTokens / 1000) * COST_PER_1K_TOKENS;

  // Check budget constraints
  if (costUSD > maxCostUSD) {
    return {
      tokensUsed: Math.floor((maxCostUSD / COST_PER_1K_TOKENS) * 1000),
      costUSD: maxCostUSD,
      summary: `Execution aborted: budget exceeded ($${costUSD.toFixed(2)} > $${maxCostUSD.toFixed(2)})`,
      status: 'FAILED',
      runtimeSec: actualRuntimeSec,
      failureReason: 'BUDGET_EXCEEDED',
    };
  }

  if (actualRuntimeSec >= maxRuntimeSec) {
    return {
      tokensUsed: totalTokens,
      costUSD,
      summary: `Execution aborted: runtime exceeded (${actualRuntimeSec}s >= ${maxRuntimeSec}s)`,
      status: 'FAILED',
      runtimeSec: maxRuntimeSec,
      failureReason: 'RUNTIME_EXCEEDED',
    };
  }

  // Simulate successful execution
  const featureList = uncoveredFeatures.join(', ') || 'custom logic';

  return {
    tokensUsed: totalTokens,
    costUSD,
    summary: `Successfully generated: ${featureList}. Used ${maxAgents} agents over ${actualRuntimeSec}s.`,
    status: 'COMPLETED',
    runtimeSec: actualRuntimeSec,
  };
}

/**
 * Validate execution parameters before starting.
 */
export function validateExecutionParams(
  params: KimiExecutionParams
): { valid: true } | { valid: false; error: string } {
  if (params.maxCostUSD <= 0) {
    return { valid: false, error: 'maxCostUSD must be positive' };
  }
  if (params.maxAgents <= 0) {
    return { valid: false, error: 'maxAgents must be positive' };
  }
  if (params.maxRuntimeSec <= 0) {
    return { valid: false, error: 'maxRuntimeSec must be positive' };
  }
  if (!Array.isArray(params.allowedScopes)) {
    return { valid: false, error: 'allowedScopes must be an array' };
  }
  return { valid: true };
}
