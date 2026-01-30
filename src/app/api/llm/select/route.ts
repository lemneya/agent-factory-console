import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { LLMSelectRequestSchema } from '@/lib/llm/registry/types';
import { getRegistryForTenant } from '@/lib/llm/registry/registry';
import { selectModel } from '@/lib/llm/selection/policy';

/**
 * AFC-LLM-REGISTRY-0
 * Selection-only endpoint. Must be strict. No silent defaults.
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

  try {
    const registry = await getRegistryForTenant(input.tenantId);
    const selection = selectModel(input, registry);

    await writeAuditEvent(input.tenantId, {
      type: 'LLM_MODEL_SELECTED',
      at: new Date().toISOString(),
      tenantId: input.tenantId,
      input: {
        taskType: input.taskType,
        riskTier: input.riskTier,
        dataResidency: input.dataResidency,
        dataClassification: input.dataClassification,
        budgetProfile: input.budgetProfile,
        moltbotSuggestion: input.moltbotSuggestion ?? null,
      },
      output: {
        selected: selection.selected,
        fallback: selection.fallback,
        registryVersion: selection.rationale.registryVersion,
        policyVersion: selection.rationale.policyVersion,
        decisionHash: selection.decisionHash,
      },
      exclusionsCount: selection.rationale.exclusions.length,
    });

    return NextResponse.json(selection, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';

    await writeAuditEvent(input.tenantId, {
      type: 'LLM_MODEL_SELECTION_FAILED',
      at: new Date().toISOString(),
      tenantId: input.tenantId,
      error: msg,
    });

    if (msg === 'NO_ELIGIBLE_MODELS') {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
