import crypto from 'crypto';
import {
  Capability,
  DataClassification,
  DataResidency,
  LLMRegistryEntry,
  LLMSelectRequest,
  LLMSelectResponse,
  RiskTier,
} from '../registry/types';
import { buildTieBreakString, costRank, reliabilityRank } from './explain';

export const POLICY_VERSION = 'AFC-LLM-REGISTRY-0@1';

type ExclusionReason =
  | 'residency_mismatch'
  | 'data_classification_disallowed'
  | 'risk_tier_exceeded'
  | 'budget_disallowed'
  | 'capability_missing';

type Exclusion = { key: string; reason: ExclusionReason };

type Scored = {
  entry: LLMRegistryEntry;
  score: number;
  notes: string[];
};

function riskRank(r: RiskTier): number {
  // Higher is more sensitive
  switch (r) {
    case 'L0':
      return 0;
    case 'L1':
      return 1;
    case 'L2':
      return 2;
    case 'L3':
      return 3;
  }
}

function requiresCapabilities(taskType: LLMSelectRequest['taskType']): Capability[] {
  switch (taskType) {
    case 'CODE_GENERATION':
      return ['CODING', 'REASONING'];
    case 'CODE_REVIEW':
      return ['CODING', 'REASONING'];
    case 'ARCHITECTURE':
      return ['REASONING', 'LONG_CONTEXT'];
    case 'PRODUCT_SPEC':
      return ['REASONING'];
    case 'DATA_TRANSFORM':
      return ['REASONING'];
    case 'CUSTOMER_SUPPORT':
      return ['REASONING'];
    case 'AGENT_ORCHESTRATION':
      return ['FUNCTION_CALLING', 'REASONING'];
  }
}

function budgetAllows(
  costClass: LLMRegistryEntry['costClass'],
  budget: LLMSelectRequest['budgetProfile']
): boolean {
  if (budget === 'PREMIUM') return true;
  if (budget === 'STANDARD') return true; // keep permissive but deterministic
  // CHEAP excludes HIGH
  return costClass !== 'HIGH';
}

function residencyAllowed(entryAllowed: DataResidency[], required: DataResidency): boolean {
  if (entryAllowed.includes('ANY')) return true;
  if (required === 'ANY') return true; // request says it can be anywhere
  return entryAllowed.includes(required);
}

function classificationAllowed(
  allowed: DataClassification[],
  required: DataClassification
): boolean {
  return allowed.includes(required);
}

function canonicalize(obj: unknown): string {
  // Deterministic JSON stringify with stable key order
  const sorter = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sorter);
    if (value && typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = sorter((value as Record<string, unknown>)[k]);
      return out;
    }
    return value;
  };
  return JSON.stringify(sorter(obj));
}

function sha256(input: string): string {
  return 'sha256:' + crypto.createHash('sha256').update(input).digest('hex');
}

function scoreCandidate(
  entry: LLMRegistryEntry,
  requiredCaps: Capability[],
  taskType: LLMSelectRequest['taskType']
): Scored {
  const caps = new Set(entry.capabilities);
  let score = 0;
  const notes: string[] = [];

  const needCoding = requiredCaps.includes('CODING');
  const needReasoning = requiredCaps.includes('REASONING');
  const needLong = requiredCaps.includes('LONG_CONTEXT');
  const needFn = requiredCaps.includes('FUNCTION_CALLING');

  if (needCoding && caps.has('CODING')) {
    score += 50;
    notes.push('coding_ok');
  }
  if (needReasoning && caps.has('REASONING')) {
    score += 30;
    notes.push('reasoning_ok');
  }
  if (needLong && caps.has('LONG_CONTEXT')) {
    score += 10;
    notes.push('long_context_ok');
  } else if (taskType === 'ARCHITECTURE' && caps.has('LONG_CONTEXT')) {
    score += 10;
    notes.push('long_context_bonus');
  }

  if (needFn && caps.has('FUNCTION_CALLING')) {
    score += 10;
    notes.push('function_calling_ok');
  }

  // Static preference shaping (deterministic)
  const rel = reliabilityRank(entry.reliabilityClass);
  if (rel === 2) {
    score += 5;
    notes.push('reliability_high_bonus');
  } else if (rel === 1) {
    score += 3;
    notes.push('reliability_medium_bonus');
  }

  const cost = costRank(entry.costClass);
  if (cost === 2) {
    score -= 7;
    notes.push('cost_high_penalty');
  } else if (cost === 1) {
    score -= 3;
    notes.push('cost_medium_penalty');
  }

  return { entry, score, notes };
}

export function selectModel(
  input: LLMSelectRequest,
  registry: { registryVersion: string; entries: LLMRegistryEntry[] }
): LLMSelectResponse {
  const requiredCaps = requiresCapabilities(input.taskType);

  const exclusions: Exclusion[] = [];
  const scored: Scored[] = [];

  for (const entry of registry.entries) {
    // Hard constraints first
    if (!residencyAllowed(entry.allowedResidencies, input.dataResidency)) {
      exclusions.push({ key: entry.key, reason: 'residency_mismatch' });
      continue;
    }
    if (!classificationAllowed(entry.allowedDataClassifications, input.dataClassification)) {
      exclusions.push({ key: entry.key, reason: 'data_classification_disallowed' });
      continue;
    }
    if (riskRank(input.riskTier) > riskRank(entry.maxRiskTier)) {
      exclusions.push({ key: entry.key, reason: 'risk_tier_exceeded' });
      continue;
    }
    if (!budgetAllows(entry.costClass, input.budgetProfile)) {
      exclusions.push({ key: entry.key, reason: 'budget_disallowed' });
      continue;
    }

    const caps = new Set(entry.capabilities);
    const missing = requiredCaps.filter(c => !caps.has(c));
    if (missing.length > 0) {
      exclusions.push({ key: entry.key, reason: 'capability_missing' });
      continue;
    }

    scored.push(scoreCandidate(entry, requiredCaps, input.taskType));
  }

  if (scored.length === 0) {
    // Deterministic failure: no silent fallback.
    // Caller (API route) should map this to 409 or 422.
    throw new Error('NO_ELIGIBLE_MODELS');
  }

  // Deterministic sorting with explicit tie-breakers:
  // 1) score desc
  // 2) costClass asc (LOW < MED < HIGH)
  // 3) reliabilityClass desc (HIGH > MED > LOW)
  // 4) key asc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const costA = costRank(a.entry.costClass);
    const costB = costRank(b.entry.costClass);
    if (costA !== costB) return costA - costB;

    const relA = reliabilityRank(a.entry.reliabilityClass);
    const relB = reliabilityRank(b.entry.reliabilityClass);
    if (relA !== relB) return relB - relA;

    return a.entry.key.localeCompare(b.entry.key);
  });

  const selected = scored[0].entry;
  const fallback = scored.slice(1, 4).map(s => s.entry);

  const rationaleScores = scored.slice(0, 10).map(s => ({
    key: s.entry.key,
    score: s.score,
    notes: s.notes,
  }));

  const decisionPayload = {
    input: {
      tenantId: input.tenantId,
      taskType: input.taskType,
      riskTier: input.riskTier,
      dataResidency: input.dataResidency,
      dataClassification: input.dataClassification,
      budgetProfile: input.budgetProfile,
      moltbotSuggestion: input.moltbotSuggestion ?? null,
    },
    policyVersion: POLICY_VERSION,
    registryVersion: registry.registryVersion,
    selectedKey: selected.key,
    fallbackKeys: fallback.map(f => f.key),
  };

  const decisionHash = sha256(canonicalize(decisionPayload));

  return {
    selected: { key: selected.key, provider: selected.provider, model: selected.model },
    fallback: fallback.map(f => ({ key: f.key, provider: f.provider, model: f.model })),
    rationale: {
      policyVersion: POLICY_VERSION,
      registryVersion: registry.registryVersion,
      exclusions: exclusions.map(e => ({ key: e.key, reason: e.reason })),
      scores: rationaleScores,
      tieBreak: buildTieBreakString(),
    },
    decisionHash,
  };
}
