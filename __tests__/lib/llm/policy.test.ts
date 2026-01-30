import { selectModel } from '@/lib/llm/selection/policy';
import { LLMSelectRequest, LLMRegistryEntry } from '@/lib/llm/registry/types';

const registry = {
  registryVersion: 'reg_test',
  entries: [
    {
      key: 'a-low',
      provider: 'p',
      model: 'm',
      tenantScope: 'GLOBAL',
      tenantId: null,
      capabilities: ['CODING', 'REASONING'],
      maxRiskTier: 'L2',
      allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
      allowedResidencies: ['US'],
      costClass: 'LOW',
      reliabilityClass: 'MEDIUM',
    },
    {
      key: 'b-high',
      provider: 'p',
      model: 'm2',
      tenantScope: 'GLOBAL',
      tenantId: null,
      capabilities: ['CODING', 'REASONING'],
      maxRiskTier: 'L2',
      allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
      allowedResidencies: ['US'],
      costClass: 'HIGH',
      reliabilityClass: 'HIGH',
    },
    {
      key: 'c-eu',
      provider: 'p',
      model: 'm3',
      tenantScope: 'GLOBAL',
      tenantId: null,
      capabilities: ['CODING', 'REASONING'],
      maxRiskTier: 'L2',
      allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
      allowedResidencies: ['EU'],
      costClass: 'LOW',
      reliabilityClass: 'HIGH',
    },
  ] as LLMRegistryEntry[],
};

function baseInput(): LLMSelectRequest {
  return {
    tenantId: 't1',
    taskType: 'CODE_REVIEW',
    riskTier: 'L2',
    dataResidency: 'US',
    dataClassification: 'CONFIDENTIAL',
    budgetProfile: 'STANDARD',
    moltbotSuggestion: { key: 'b-high' },
  };
}

describe('AFC-LLM-REGISTRY-0 selection policy', () => {
  it('is deterministic (same input -> same output hash)', () => {
    const a = selectModel(baseInput(), registry);
    const b = selectModel(baseInput(), registry);
    expect(a.selected.key).toBe(b.selected.key);
    expect(a.decisionHash).toBe(b.decisionHash);
  });

  it('excludes residency mismatch', () => {
    const out = selectModel(baseInput(), registry);
    const hasEUExclusion = out.rationale.exclusions.some(e => e.key === 'c-eu');
    expect(hasEUExclusion).toBe(true);
  });

  it('applies risk exclusion', () => {
    const input = baseInput();
    input.riskTier = 'L3';
    expect(() => selectModel(input, registry)).toThrow('NO_ELIGIBLE_MODELS');
  });

  it('tie-break uses cost then reliability then lex (stable)', () => {
    // In this registry, a-low is cheaper but b-high more reliable.
    // Score shaping includes cost penalties; should prefer a-low.
    const out = selectModel(baseInput(), registry);
    expect(out.selected.key).toBe('a-low');
  });

  it('includes rationale with scores and exclusions', () => {
    const out = selectModel(baseInput(), registry);
    expect(out.rationale.policyVersion).toContain('AFC-LLM-REGISTRY-0');
    expect(out.rationale.registryVersion).toBe('reg_test');
    expect(out.rationale.tieBreak).toBe('score>cost>reliability>lex');
    expect(out.rationale.scores.length).toBeGreaterThan(0);
    expect(out.rationale.exclusions.length).toBeGreaterThan(0);
  });

  it('provides fallback models when available', () => {
    const out = selectModel(baseInput(), registry);
    // Should have b-high as fallback (after a-low selected)
    expect(out.fallback.length).toBe(1);
    expect(out.fallback[0].key).toBe('b-high');
  });

  it('includes decisionHash for audit trail', () => {
    const out = selectModel(baseInput(), registry);
    expect(out.decisionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('throws when no models match constraints', () => {
    const emptyRegistry = { registryVersion: 'empty', entries: [] };
    expect(() => selectModel(baseInput(), emptyRegistry)).toThrow('NO_ELIGIBLE_MODELS');
  });

  it('excludes models when budget is CHEAP and cost is HIGH', () => {
    const input = baseInput();
    input.budgetProfile = 'CHEAP';
    const out = selectModel(input, registry);
    // b-high should be excluded due to budget
    const hasHighExclusion = out.rationale.exclusions.some(
      e => e.key === 'b-high' && e.reason === 'budget_disallowed'
    );
    expect(hasHighExclusion).toBe(true);
  });
});
