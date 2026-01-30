/**
 * AFC-KIMI-ROUTER-0: Execution Module
 *
 * Controlled Kimi execution with strict budgets.
 * NOTE: This does NOT allow autonomous execution.
 */

export {
  executeKimi,
  validateExecutionParams,
  type KimiExecutionParams,
  type KimiExecutionResult,
} from './kimi-adapter';

export {
  runExecution,
  requiresExecution,
  DEFAULT_MAX_COST_USD,
  DEFAULT_MAX_AGENTS,
  DEFAULT_MAX_RUNTIME_SEC,
  DEFAULT_ALLOWED_SCOPES,
  type ExecutionRequest,
  type ExecutionResponse,
  type BuildPlanDetails,
} from './execution-router';
