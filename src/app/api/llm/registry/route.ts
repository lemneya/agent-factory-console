import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getRegistryForTenant } from '@/lib/llm/registry/registry';

/**
 * AFC-LLM-REGISTRY-0
 * Registry view endpoint. Read-only. Tenant-scoped.
 */

async function requireTenantAccess(tenantId: string, userId: string) {
  // For this gate, tenantId must match userId (single-tenant per user model).
  if (tenantId !== userId) {
    return { error: 'Tenant access denied', status: 403 };
  }
  return { success: true };
}

async function writeAuditEvent(tenantId: string, event: Record<string, unknown>) {
  // Minimal audit logging for this gate.
  console.log('[LLM-AUDIT]', JSON.stringify({ tenantId, ...event }));
}

export async function GET(req: Request) {
  // 1) Authenticate
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  // 2) Get tenantId from query params
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId_required' }, { status: 400 });
  }

  // 3) Verify tenant access
  const tenantCheck = await requireTenantAccess(tenantId, userId);
  if ('error' in tenantCheck) {
    return NextResponse.json({ error: tenantCheck.error }, { status: tenantCheck.status });
  }

  const registry = await getRegistryForTenant(tenantId);

  await writeAuditEvent(tenantId, {
    type: 'LLM_REGISTRY_VIEWED',
    at: new Date().toISOString(),
    tenantId,
    registryVersion: registry.registryVersion,
    count: registry.entries.length,
  });

  // Sanitized already (no secrets in registry by design)
  return NextResponse.json(registry, { status: 200 });
}
