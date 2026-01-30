import { buildProofPack, generateProofPackId } from '@/lib/proofpack/builder';
import { sha256, canonicalize, verifyHash } from '@/lib/proofpack/hash';
import { ProofPackSchema } from '@/lib/proofpack/types';

describe('AFC-PROOFPACK-0: Hash Utilities', () => {
  it('produces deterministic hashes for same input', () => {
    const input = { foo: 'bar', baz: 123 };
    const hash1 = sha256(input);
    const hash2 = sha256(input);
    expect(hash1).toBe(hash2);
  });

  it('produces same hash regardless of key order', () => {
    const input1 = { a: 1, b: 2, c: 3 };
    const input2 = { c: 3, a: 1, b: 2 };
    expect(sha256(input1)).toBe(sha256(input2));
  });

  it('canonicalizes nested objects', () => {
    const input = { z: { b: 2, a: 1 }, y: [3, 1, 2] };
    const canonical = canonicalize(input);
    expect(canonical).toBe('{"y":[3,1,2],"z":{"a":1,"b":2}}');
  });

  it('verifyHash returns true for matching hash', () => {
    const input = { test: 'data' };
    const hash = sha256(input);
    expect(verifyHash(input, hash)).toBe(true);
  });

  it('verifyHash returns false for non-matching hash', () => {
    const input = { test: 'data' };
    expect(verifyHash(input, 'sha256:wrong')).toBe(false);
  });

  it('hash format is sha256:<64 hex chars>', () => {
    const hash = sha256({ any: 'input' });
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe('AFC-PROOFPACK-0: Proof Pack Builder', () => {
  const baseParams = {
    proofPackId: 'pp_test_123',
    tenantId: 'tenant-1',
    runId: 'run-1',
    type: 'LLM_SELECTION' as const,
    policyVersion: 'AFC-LLM-REGISTRY-0@1',
    registryVersion: 'reg_v1',
    input: { taskType: 'CODE_GENERATION' },
    decisions: { selectedModel: 'azure-oss-qwen-us' },
    approvals: [{ role: 'system', actorId: 'afc', at: '2026-01-30T00:00:00Z' }],
    output: { selected: { key: 'azure-oss-qwen-us' } },
  };

  it('builds a valid proof pack', () => {
    const pack = buildProofPack(baseParams);
    expect(pack.proofPackId).toBe('pp_test_123');
    expect(pack.tenantId).toBe('tenant-1');
    expect(pack.runId).toBe('run-1');
    expect(pack.type).toBe('LLM_SELECTION');
  });

  it('computes hashes for input, decisions, and output', () => {
    const pack = buildProofPack(baseParams);
    expect(pack.hashes.inputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(pack.hashes.decisionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(pack.hashes.outputHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('hashes are deterministic', () => {
    const pack1 = buildProofPack(baseParams);
    const pack2 = buildProofPack(baseParams);
    expect(pack1.hashes.inputHash).toBe(pack2.hashes.inputHash);
    expect(pack1.hashes.decisionHash).toBe(pack2.hashes.decisionHash);
    expect(pack1.hashes.outputHash).toBe(pack2.hashes.outputHash);
  });

  it('includes createdAt timestamp', () => {
    const pack = buildProofPack(baseParams);
    expect(pack.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('passes schema validation', () => {
    const pack = buildProofPack(baseParams);
    const result = ProofPackSchema.safeParse(pack);
    expect(result.success).toBe(true);
  });

  it('preserves approval chain', () => {
    const pack = buildProofPack(baseParams);
    expect(pack.approvals).toHaveLength(1);
    expect(pack.approvals[0].role).toBe('system');
    expect(pack.approvals[0].actorId).toBe('afc');
  });
});

describe('AFC-PROOFPACK-0: ID Generation', () => {
  it('generates unique IDs', () => {
    const id1 = generateProofPackId();
    const id2 = generateProofPackId();
    expect(id1).not.toBe(id2);
  });

  it('ID format is pp_<timestamp>_<random>', () => {
    const id = generateProofPackId();
    expect(id).toMatch(/^pp_[a-z0-9]+_[a-z0-9]+$/);
  });
});
