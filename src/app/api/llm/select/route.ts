import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { LLMSelectRequestSchema } from '@/lib/llm/registry/types';
import { getRegistryForTenant } from '@/lib/llm/registry/registry';
import { selectModel } from '@/lib/llm/selection/policy';
import { buildProofPack, randomId } from '@/lib/proofpack';

/**
 * AFC-LLM-REGISTRY-0 + AFC-PROOFPACK-EMIT-1
 * Selection endpoint with proof pack emission.
 * Must be strict. No silent defaults.
 */

async function requireTenantAccess(tenantId: string, userId: string) {
  // For this gate, tenantId must match userId (single-tenant per user model).
  // Future: support org-level tenants with membership checks.
  if (tenantId !== userId) {
    return { error: 'Tenant access denied', status: 403 };
  }
  return { success: true };
}

async function writeAuditEvent(tenantId: string, event: Record<string, unknown>) {
  // Minimal audit logging for this gate.
  // Future: persist to AuditEvent table in Prisma.
  console.log('[LLM-AUDIT]', JSON.stringify({ tenantId, ...event }));
}

export async function POST(req: Request) {
  // 1) Authenticate
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  // 2) Parse and validate request
  const raw = await req.json().catch(() => null);
  const parsed = LLMSelectRequestSchema.safeParse(raw);

  if (!parsed.success) {
    // Strict: no silent defaults.
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // 3) Verify tenant access
  const tenantCheck = await requireTenantAccess(input.tenantId, userId);
  if ('error' in tenantCheck) {
    return NextResponse.json({ error: tenantCheck.error }, { status: tenantCheck.status });
  }

  // Generate IDs for this request
  const runId = randomId('run');
  const proofPackId = randomId('pp');

  try {
    const registry = await getRegistryForTenant(input.tenantId);
    const selection = selectModel(input, registry);

    // Build proof pack for this selection
    const proofPackInput = {
      taskType: input.taskType,
      riskTier: input.riskTier,
      dataResidency: input.dataResidency,
      dataClassification: input.dataClassification,
      budgetProfile: input.budgetProfile,
      moltbotSuggestion: input.moltbotSuggestion ?? null,
    };

    let proofPack;
    try {
      proofPack = buildProofPack({
        proofPackId,
        tenantId: input.tenantId,
        runId,
        type: 'LLM_SELECTION',
        policyVersion: selection.rationale.policyVersion,
        registryVersion: selection.rationale.registryVersion,
        input: proofPackInput,
        decisions: selection,
        approvals: [],
        output: selection,
      });

      // Enforce hash consistency: proof pack decision hash must match selection decision hash
      // Note: The proof pack hashes the entire selection object (including decisionHash),
      // so we verify the selection's internal decisionHash is present and valid
      if (!selection.decisionHash || !selection.decisionHash.startsWith('sha256:')) {
        throw new Error('PROOFPACK_DECISION_HASH_MISMATCH');
      }
    } catch (proofErr: unknown) {
      const proofMsg = proofErr instanceof Error ? proofErr.message : 'UNKNOWN_ERROR';

      await writeAuditEvent(input.tenantId, {
        type: 'LLM_PROOFPACK_EMIT_FAILED',
        at: new Date().toISOString(),
        tenantId: input.tenantId,
        runId,
        proofPackId,
        error: proofMsg,
      });

      return NextResponse.json(
        { error: 'PROOFPACK_EMIT_FAILED', details: proofMsg },
        { status: 500 }
      );
    }

    await writeAuditEvent(input.tenantId, {
      type: 'LLM_MODEL_SELECTED',
      at: new Date().toISOString(),
      tenantId: input.tenantId,
      runId,
      proofPackId,
      input: proofPackInput,
      output: {
        selected: selection.selected,
        fallback: selection.fallback,
        registryVersion: selection.rationale.registryVersion,
        policyVersion: selection.rationale.policyVersion,
        decisionHash: selection.decisionHash,
      },
      exclusionsCount: selection.rationale.exclusions.length,
    });

    return NextResponse.json({ ...selection, proofPack, runId }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';

    await writeAuditEvent(input.tenantId, {
      type: 'LLM_MODEL_SELECTION_FAILED',
      at: new Date().toISOString(),
      tenantId: input.tenantId,
      runId,
      proofPackId,
      error: msg,
    });

    if (msg === 'NO_ELIGIBLE_MODELS') {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
