import { z } from 'zod';

/**
 * AFC-LLM-REGISTRY-0
 * Selection-only. No provider calls. No defaults. Strict schemas.
 */

export const TaskType = z.enum([
  'CODE_GENERATION',
  'CODE_REVIEW',
  'ARCHITECTURE',
  'PRODUCT_SPEC',
  'DATA_TRANSFORM',
  'CUSTOMER_SUPPORT',
  'AGENT_ORCHESTRATION',
]);
export type TaskType = z.infer<typeof TaskType>;

export const RiskTier = z.enum(['L0', 'L1', 'L2', 'L3']);
export type RiskTier = z.infer<typeof RiskTier>;

export const DataResidency = z.enum(['US', 'EU', 'MENA', 'ANY']);
export type DataResidency = z.infer<typeof DataResidency>;

export const DataClassification = z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'REGULATED']);
export type DataClassification = z.infer<typeof DataClassification>;

export const BudgetProfile = z.enum(['CHEAP', 'STANDARD', 'PREMIUM']);
export type BudgetProfile = z.infer<typeof BudgetProfile>;

export const CostClass = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type CostClass = z.infer<typeof CostClass>;

export const ReliabilityClass = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type ReliabilityClass = z.infer<typeof ReliabilityClass>;

export const Capability = z.enum([
  'CODING',
  'REASONING',
  'LONG_CONTEXT',
  'FUNCTION_CALLING',
  'VISION',
]);
export type Capability = z.infer<typeof Capability>;

export const TenantScope = z.enum(['GLOBAL', 'TENANT']);
export type TenantScope = z.infer<typeof TenantScope>;

export const LLMRegistryEntrySchema = z.object({
  key: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),

  tenantScope: TenantScope,
  tenantId: z.string().min(1).nullable(), // must be non-null when TENANT

  capabilities: z.array(Capability).min(1),

  maxRiskTier: RiskTier,
  allowedDataClassifications: z.array(DataClassification).min(1),
  allowedResidencies: z.array(DataResidency).min(1),

  costClass: CostClass,
  reliabilityClass: ReliabilityClass,

  notes: z.string().optional(),
});
export type LLMRegistryEntry = z.infer<typeof LLMRegistryEntrySchema>;

export const MoltbotSuggestionSchema = z
  .object({
    key: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
  })
  .strict();

export const LLMSelectRequestSchema = z
  .object({
    tenantId: z.string().min(1),
    taskType: TaskType,
    riskTier: RiskTier,
    dataResidency: DataResidency,
    dataClassification: DataClassification,
    budgetProfile: BudgetProfile,
    moltbotSuggestion: MoltbotSuggestionSchema.optional(),
  })
  .strict();
export type LLMSelectRequest = z.infer<typeof LLMSelectRequestSchema>;

export const SelectionModelSchema = z
  .object({
    key: z.string(),
    provider: z.string(),
    model: z.string(),
  })
  .strict();
export type SelectionModel = z.infer<typeof SelectionModelSchema>;

export const LLMSelectResponseSchema = z
  .object({
    selected: SelectionModelSchema,
    fallback: z.array(SelectionModelSchema),
    rationale: z
      .object({
        policyVersion: z.string(),
        registryVersion: z.string(),
        exclusions: z.array(
          z
            .object({
              key: z.string(),
              reason: z.string(),
            })
            .strict()
        ),
        scores: z.array(
          z
            .object({
              key: z.string(),
              score: z.number(),
              notes: z.array(z.string()),
            })
            .strict()
        ),
        tieBreak: z.string(),
      })
      .strict(),
    decisionHash: z.string(),
  })
  .strict();
export type LLMSelectResponse = z.infer<typeof LLMSelectResponseSchema>;
