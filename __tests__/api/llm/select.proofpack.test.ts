import { selectModel } from '@/lib/llm/selection/policy';
import { buildProofPack, randomId } from '@/lib/proofpack';
import { LLMSelectRequest, LLMRegistryEntry } from '@/lib/llm/registry/types';

/**
 * AFC-PROOFPACK-EMIT-1: Proof Pack Emission Tests
 *
 * Tests that proof pack emission works correctly with LLM selection.
 */

const testRegistry = {
  registryVersion: 'reg_test',
  entries: [
    {
      key: 'test-model-us',
      provider: 'test_provider',
      model: 'test-model',
      tenantScope: 'GLOBAL',
      tenantId: null,
      capabilities: ['CODING', 'REASONING'],
      maxRiskTier: 'L2',
      allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
      allowedResidencies: ['US'],
      costClass: 'LOW',
      reliabilityClass: 'MEDIUM',
    },
  ] as LLMRegistryEntry[],
};

function createTestInput(): LLMSelectRequest {
  return {
    tenantId: 'test-tenant',
    taskType: 'CODE_REVIEW',
    riskTier: 'L2',
    dataResidency: 'US',
    dataClassification: 'CONFIDENTIAL',
    budgetProfile: 'STANDARD',
  };
}

describe('AFC-PROOFPACK-EMIT-1: Proof Pack Emission', () => {
  describe('ID Generation', () => {
    it('randomId generates unique IDs', () => {
      const id1 = randomId('run');
      const id2 = randomId('run');
      expect(id1).not.toBe(id2);
    });

    it('randomId uses correct prefix format', () => {
      const runId = randomId('run');
      const ppId = randomId('pp');
      expect(runId).toMatch(/^run_[a-f0-9]{24}$/);
      expect(ppId).toMatch(/^pp_[a-f0-9]{24}$/);
    });
  });

  describe('Proof Pack Building with Selection', () => {
    it('builds valid proof pack from selection', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: {
          taskType: input.taskType,
          riskTier: input.riskTier,
          dataResidency: input.dataResidency,
          dataClassification: input.dataClassification,
          budgetProfile: input.budgetProfile,
          moltbotSuggestion: null,
        },
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.type).toBe('LLM_SELECTION');
      expect(proofPack.tenantId).toBe('test-tenant');
    });

    it('proof pack includes all required hashes', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: { taskType: input.taskType },
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.hashes.inputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(proofPack.hashes.decisionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(proofPack.hashes.outputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('proof pack includes policyVersion and registryVersion', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: {},
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.policyVersion).toBe(selection.rationale.policyVersion);
      expect(proofPack.registryVersion).toBe(selection.rationale.registryVersion);
    });

    it('proof pack has empty approvals array by default', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: {},
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.approvals).toEqual([]);
    });
  });

  describe('Decision Hash Consistency', () => {
    it('selection decisionHash is valid SHA256', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      expect(selection.decisionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('selection decisionHash is deterministic', () => {
      const input = createTestInput();
      const selection1 = selectModel(input, testRegistry);
      const selection2 = selectModel(input, testRegistry);

      expect(selection1.decisionHash).toBe(selection2.decisionHash);
    });

    it('proof pack emission does not alter selection decisionHash', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);
      const originalHash = selection.decisionHash;

      // Build proof pack (simulating what the route does)
      buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: {},
        decisions: selection,
        approvals: [],
        output: selection,
      });

      // Original selection hash should be unchanged
      expect(selection.decisionHash).toBe(originalHash);
    });

    it('same input produces same selection decisionHash across multiple calls', () => {
      const input = createTestInput();

      // Simulate multiple API calls
      const hashes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const selection = selectModel(input, testRegistry);
        hashes.push(selection.decisionHash);
      }

      // All hashes should be identical
      expect(new Set(hashes).size).toBe(1);
    });
  });

  describe('Proof Pack Schema Validation', () => {
    it('proof pack has createdAt timestamp', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: {},
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('proof pack preserves input data', () => {
      const input = createTestInput();
      const selection = selectModel(input, testRegistry);

      const proofPackInput = {
        taskType: input.taskType,
        riskTier: input.riskTier,
        dataResidency: input.dataResidency,
      };

      const proofPack = buildProofPack({
        proofPackId: randomId('pp'),
        tenantId: input.tenantId,
        runId: randomId('run'),
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: proofPackInput,
        decisions: selection,
        approvals: [],
        output: selection,
      });

      expect(proofPack.input).toEqual(proofPackInput);
    });
  });
});
