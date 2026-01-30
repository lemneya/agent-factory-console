import { LLMRegistryEntry, LLMRegistryEntrySchema } from './types';

/**
 * Keep this minimal. These are descriptors only — no endpoints, no secrets.
 * registryVersion can be bumped manually (preferred for governance).
 */
export const DEFAULT_REGISTRY_VERSION = 'reg_v1';

const entries: LLMRegistryEntry[] = [
  {
    key: 'azure-oai-gpt4x-us',
    provider: 'azure_openai',
    model: 'gpt-4x',
    tenantScope: 'GLOBAL',
    tenantId: null,
    capabilities: ['CODING', 'REASONING', 'LONG_CONTEXT', 'FUNCTION_CALLING'],
    maxRiskTier: 'L3',
    allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'REGULATED'],
    allowedResidencies: ['US', 'ANY'],
    costClass: 'HIGH',
    reliabilityClass: 'HIGH',
    notes: 'Premium generalist for high-risk tasks (descriptor only).',
  },
  {
    key: 'azure-oss-qwen-us',
    provider: 'azure_oss',
    model: 'qwen2.5-coder',
    tenantScope: 'GLOBAL',
    tenantId: null,
    capabilities: ['CODING', 'REASONING'],
    maxRiskTier: 'L2',
    allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
    allowedResidencies: ['US'],
    costClass: 'LOW',
    reliabilityClass: 'MEDIUM',
    notes: 'Cheap coder baseline (descriptor only).',
  },
  {
    key: 'premium-coder-eu',
    provider: 'premium_vendor',
    model: 'coder-x',
    tenantScope: 'GLOBAL',
    tenantId: null,
    capabilities: ['CODING', 'REASONING', 'LONG_CONTEXT'],
    maxRiskTier: 'L2',
    allowedDataClassifications: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
    allowedResidencies: ['EU'],
    costClass: 'MEDIUM',
    reliabilityClass: 'HIGH',
    notes: 'EU-only coding model (descriptor only).',
  },
];

export const DEFAULT_REGISTRY: LLMRegistryEntry[] = entries.map(e => {
  // Runtime schema validation prevents registry poisoning in code.
  return LLMRegistryEntrySchema.parse(e);
});
