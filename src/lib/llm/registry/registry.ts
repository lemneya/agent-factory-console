import { DEFAULT_REGISTRY, DEFAULT_REGISTRY_VERSION } from './defaultRegistry';
import { LLMRegistryEntry } from './types';

export type TenantRegistry = {
  registryVersion: string;
  entries: LLMRegistryEntry[];
};

/**
 * AFC-LLM-REGISTRY-0: tenant-scoped registry retrieval.
 * For this gate, we ship code-backed global registry only (safe baseline).
 *
 * If you later add DB overrides, DO NOT change the signature;
 * implement them inside here with strict ownership checks.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getRegistryForTenant(tenantId: string): Promise<TenantRegistry> {
  // Tenant-scoping enforcement: only GLOBAL entries and tenant-specific entries for that tenant.
  // (This gate ships with GLOBAL only. tenantId will be used for TENANT-scoped entries later.)
  const globalEntries = DEFAULT_REGISTRY.filter(e => e.tenantScope === 'GLOBAL');

  // Deterministic ordering
  const entries = [...globalEntries].sort((a, b) => a.key.localeCompare(b.key));

  return {
    registryVersion: DEFAULT_REGISTRY_VERSION,
    entries,
  };
}
