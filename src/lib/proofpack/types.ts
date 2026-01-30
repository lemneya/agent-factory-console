import { z } from 'zod';

/**
 * AFC-PROOFPACK-0: Proof Pack Type Definitions
 *
 * Proof packs provide audit-defensible evidence for all AFC decisions.
 * Every significant operation produces a proof pack with:
 * - Immutable input/output hashes
 * - Decision rationale
 * - Approval chain
 * - Policy/registry versions
 */

export const ProofPackType = z.enum([
  'LLM_SELECTION',
  'PLAN_SIMULATION',
  'EXECUTION',
  'CHAT_RESPONSE',
]);
export type ProofPackType = z.infer<typeof ProofPackType>;

export const ApprovalSchema = z.object({
  role: z.string(),
  actorId: z.string(),
  at: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

export const HashesSchema = z.object({
  inputHash: z.string(),
  decisionHash: z.string(),
  outputHash: z.string(),
});
export type Hashes = z.infer<typeof HashesSchema>;

export const ProofPackSchema = z.object({
  proofPackId: z.string(),
  tenantId: z.string(),
  runId: z.string(),

  type: ProofPackType,

  createdAt: z.string(),
  policyVersion: z.string(),
  registryVersion: z.string(),

  input: z.unknown(),
  decisions: z.unknown(),
  approvals: z.array(ApprovalSchema),

  output: z.unknown(),

  hashes: HashesSchema,
});
export type ProofPack = z.infer<typeof ProofPackSchema>;
