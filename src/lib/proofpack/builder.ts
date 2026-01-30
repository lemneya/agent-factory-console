import { ProofPack, ProofPackSchema, ProofPackType, Approval } from './types';
import { sha256 } from './hash';

/**
 * AFC-PROOFPACK-0: Proof Pack Builder
 *
 * Constructs validated proof packs with deterministic hashes.
 * All proof packs are schema-validated before returning.
 */

export interface BuildProofPackParams {
  proofPackId: string;
  tenantId: string;
  runId: string;
  type: ProofPackType;

  policyVersion: string;
  registryVersion: string;

  input: unknown;
  decisions: unknown;
  approvals: Approval[];
  output: unknown;
}

/**
 * Build a complete proof pack with computed hashes.
 * Throws if the resulting pack fails schema validation.
 */
export function buildProofPack(params: BuildProofPackParams): ProofPack {
  const inputHash = sha256(params.input);
  const decisionHash = sha256(params.decisions);
  const outputHash = sha256(params.output);

  const pack: ProofPack = {
    proofPackId: params.proofPackId,
    tenantId: params.tenantId,
    runId: params.runId,

    type: params.type,
    createdAt: new Date().toISOString(),

    policyVersion: params.policyVersion,
    registryVersion: params.registryVersion,

    input: params.input,
    decisions: params.decisions,
    approvals: params.approvals,
    output: params.output,

    hashes: {
      inputHash,
      decisionHash,
      outputHash,
    },
  };

  // Schema validation ensures pack integrity
  return ProofPackSchema.parse(pack);
}

/**
 * Generate a unique proof pack ID.
 * Format: pp_<timestamp>_<random>
 */
export function generateProofPackId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `pp_${timestamp}_${random}`;
}
