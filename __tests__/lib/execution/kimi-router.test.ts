/**
 * AFC-KIMI-ROUTER-0: Kimi Router Tests
 *
 * Tests execution eligibility, budget enforcement, and determinism.
 */

import {
  requiresExecution,
  DEFAULT_MAX_COST_USD,
  DEFAULT_MAX_AGENTS,
  DEFAULT_MAX_RUNTIME_SEC,
  type BuildPlanDetails,
} from '@/lib/execution/execution-router';

import {
  executeKimi,
  validateExecutionParams,
  type KimiExecutionParams,
} from '@/lib/execution/kimi-adapter';

describe('Kimi Router', () => {
  describe('Execution Eligibility', () => {
    it('allows execution for CUSTOM strategy', () => {
      const result = requiresExecution('CUSTOM', {});
      expect(result).toBe(true);
    });

    it('allows execution when requiresKimi is true', () => {
      const details: BuildPlanDetails = { requiresKimi: true };
      const result = requiresExecution('INVENTORY_PLUS_OSS', details);
      expect(result).toBe(true);
    });

    it('denies execution for INVENTORY strategy without requiresKimi', () => {
      const details: BuildPlanDetails = { requiresKimi: false };
      const result = requiresExecution('INVENTORY', details);
      expect(result).toBe(false);
    });

    it('denies execution for OSS strategy without requiresKimi', () => {
      const details: BuildPlanDetails = {};
      const result = requiresExecution('OSS', details);
      expect(result).toBe(false);
    });

    it('denies execution for INVENTORY_PLUS_OSS without requiresKimi', () => {
      const details: BuildPlanDetails = { requiresKimi: false };
      const result = requiresExecution('INVENTORY_PLUS_OSS', details);
      expect(result).toBe(false);
    });
  });

  describe('Budget Defaults', () => {
    it('has conservative default cost limit', () => {
      expect(DEFAULT_MAX_COST_USD).toBe(25);
    });

    it('has conservative default agent limit', () => {
      expect(DEFAULT_MAX_AGENTS).toBe(5);
    });

    it('has conservative default runtime limit', () => {
      expect(DEFAULT_MAX_RUNTIME_SEC).toBe(600);
    });
  });

  describe('Parameter Validation', () => {
    it('rejects zero maxCostUSD', () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 0,
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: [],
        uncoveredFeatures: [],
      };
      const result = validateExecutionParams(params);
      expect(result.valid).toBe(false);
    });

    it('rejects negative maxAgents', () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 25,
        maxAgents: -1,
        maxRuntimeSec: 600,
        allowedScopes: [],
        uncoveredFeatures: [],
      };
      const result = validateExecutionParams(params);
      expect(result.valid).toBe(false);
    });

    it('rejects zero maxRuntimeSec', () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 25,
        maxAgents: 5,
        maxRuntimeSec: 0,
        allowedScopes: [],
        uncoveredFeatures: [],
      };
      const result = validateExecutionParams(params);
      expect(result.valid).toBe(false);
    });

    it('accepts valid parameters', () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 25,
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: ['custom_logic'],
        uncoveredFeatures: ['chat'],
      };
      const result = validateExecutionParams(params);
      expect(result.valid).toBe(true);
    });
  });

  describe('Budget Enforcement', () => {
    it('fails when cost exceeds budget', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 0.01, // Very low budget
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: ['custom_logic'],
        uncoveredFeatures: ['chat', 'auth', 'billing', 'dashboard', 'analytics'],
      };

      const result = await executeKimi(params);

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toBe('BUDGET_EXCEEDED');
      expect(result.costUSD).toBeLessThanOrEqual(params.maxCostUSD);
    });

    it('completes when within budget', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 100, // High budget
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: ['custom_logic'],
        uncoveredFeatures: ['chat'],
      };

      const result = await executeKimi(params);

      expect(result.status).toBe('COMPLETED');
      expect(result.costUSD).toBeLessThanOrEqual(params.maxCostUSD);
    });

    it('respects runtime limits', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 100,
        maxAgents: 1, // Single agent = longer runtime
        maxRuntimeSec: 5, // Very short limit
        allowedScopes: ['custom_logic'],
        uncoveredFeatures: ['chat', 'auth', 'billing', 'dashboard', 'analytics'],
      };

      const result = await executeKimi(params);

      expect(result.runtimeSec).toBeLessThanOrEqual(params.maxRuntimeSec);
    });
  });

  describe('Determinism', () => {
    it('produces consistent results for same input', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 50,
        maxAgents: 3,
        maxRuntimeSec: 300,
        allowedScopes: ['custom_logic', 'integration_glue'],
        uncoveredFeatures: ['chat', 'notifications'],
      };

      const result1 = await executeKimi(params);
      const result2 = await executeKimi(params);

      expect(result1.tokensUsed).toBe(result2.tokensUsed);
      expect(result1.costUSD).toBe(result2.costUSD);
      expect(result1.status).toBe(result2.status);
      expect(result1.runtimeSec).toBe(result2.runtimeSec);
    });

    it('scales tokens with feature count', async () => {
      const fewFeatures: KimiExecutionParams = {
        maxCostUSD: 100,
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: [],
        uncoveredFeatures: ['chat'],
      };

      const manyFeatures: KimiExecutionParams = {
        ...fewFeatures,
        uncoveredFeatures: ['chat', 'auth', 'billing', 'dashboard'],
      };

      const result1 = await executeKimi(fewFeatures);
      const result2 = await executeKimi(manyFeatures);

      expect(result2.tokensUsed).toBeGreaterThan(result1.tokensUsed);
      expect(result2.costUSD).toBeGreaterThan(result1.costUSD);
    });
  });

  describe('Execution Summary', () => {
    it('includes feature list in summary on success', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 100,
        maxAgents: 3,
        maxRuntimeSec: 600,
        allowedScopes: [],
        uncoveredFeatures: ['chat', 'notifications'],
      };

      const result = await executeKimi(params);

      expect(result.summary).toContain('chat');
      expect(result.summary).toContain('notifications');
    });

    it('includes failure reason in summary on failure', async () => {
      const params: KimiExecutionParams = {
        maxCostUSD: 0.001,
        maxAgents: 5,
        maxRuntimeSec: 600,
        allowedScopes: [],
        uncoveredFeatures: ['chat'],
      };

      const result = await executeKimi(params);

      expect(result.summary).toContain('aborted');
      expect(result.summary).toContain('budget');
    });
  });
});
