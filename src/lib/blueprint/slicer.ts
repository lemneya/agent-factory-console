/**
 * AFC-1.7: Deterministic Slicer Algorithm
 *
 * Transforms a BlueprintVersion into WorkOrders.
 * Must be deterministic: same input → same keys/specHash/order.
 */

import { Prisma, WorkOrderDomain, WorkOrderStatus } from '@prisma/client';
import {
  BlueprintSpec,
  BlueprintModule,
  BlueprintDomain,
  validateBlueprintSpec,
  computeSpecHash,
  VALID_DOMAINS,
} from './schema';

// Default owned paths mapping (fallback if no hints)
export const DEFAULT_OWNED_PATHS: Record<BlueprintDomain, string[]> = {
  BACKEND: ['prisma/**', 'src/app/api/**', 'src/lib/**'],
  FRONTEND: ['src/app/**', 'src/components/**', 'src/styles/**'],
  QA: ['tests/**', 'evidence/**', '__tests__/**', 'playwright/**'],
  DEVOPS: ['.github/**', 'docker/**', 'scripts/**'],
  ALGO: ['src/lib/routing/**', 'src/lib/algorithms/**'],
  INTEGRATION: ['coordination/**'],
};

// Domain short codes for key generation
const DOMAIN_SHORT_CODES: Record<BlueprintDomain, string> = {
  FRONTEND: 'UI',
  BACKEND: 'BE',
  DEVOPS: 'DO',
  QA: 'QA',
  ALGO: 'AL',
  INTEGRATION: 'IN',
};

// Slicer options
export interface SlicerOptions {
  projectId: string;
  runId?: string;
  mode?: 'PLAN_ONLY' | 'CREATE_TASKS';
}

// WorkOrder creation data (before persistence)
export interface WorkOrderData {
  key: string;
  title: string;
  summary: string;
  domain: WorkOrderDomain;
  specIds: string[];
  ownedPaths: string[];
  interfaces: Array<{ name: string; path: string; description?: string }>;
  acceptanceChecks: string[];
  assetsToUse: string[];
  memoryHints: string[];
  moduleId: string;
  dependsOnKeys: string[];
}

// Slicer result
export interface SlicerResult {
  specHash: string;
  workOrders: WorkOrderData[];
  dependencyGraph: Map<string, string[]>;
  errors: string[];
}

/**
 * Deterministic key generation for WorkOrders
 * Format: {blueprint_id}-{domain_short}-{seq}
 * Sequence is global across all modules for stable ordering
 */
function generateWorkOrderKey(
  blueprintId: string,
  domain: BlueprintDomain,
  globalSeq: number
): string {
  const domainShort = DOMAIN_SHORT_CODES[domain];
  const seqPadded = String(globalSeq).padStart(3, '0');
  return `${blueprintId}-${domainShort}-${seqPadded}`;
}

/**
 * Get owned paths for a domain, using hints if available
 */
function getOwnedPaths(module: BlueprintModule, domain: BlueprintDomain): string[] {
  if (module.owned_paths_hint?.[domain]) {
    return module.owned_paths_hint[domain] as string[];
  }
  return DEFAULT_OWNED_PATHS[domain] || [];
}

/**
 * Get spec IDs for a domain within a module
 * If spec items have domain tags, filter by domain; otherwise return all
 */
function getSpecIdsForDomain(module: BlueprintModule, domain: BlueprintDomain): string[] {
  const hasDomainTags = module.spec_items.some(item => item.domain);

  if (hasDomainTags) {
    return module.spec_items
      .filter(item => !item.domain || item.domain === domain)
      .map(item => item.spec_id);
  }

  return module.spec_items.map(item => item.spec_id);
}

/**
 * Get acceptance checks for a domain within a module
 */
function getAcceptanceChecks(module: BlueprintModule, domain: BlueprintDomain): string[] {
  const specIds = new Set(getSpecIdsForDomain(module, domain));
  const checks: string[] = [];

  for (const item of module.spec_items) {
    if (specIds.has(item.spec_id)) {
      checks.push(...item.acceptance);
    }
  }

  return [...new Set(checks)]; // Dedupe
}

/**
 * Generate memory hints for a WorkOrder
 */
function generateMemoryHints(
  module: BlueprintModule,
  domain: BlueprintDomain,
  specIds: string[]
): string[] {
  const hints: string[] = [...specIds, module.module_id, `domain:${domain}`];

  // Add interface names as hints
  if (module.interfaces) {
    for (const iface of module.interfaces) {
      hints.push(`interface:${iface.name}`);
    }
  }

  return hints;
}

/**
 * Compute dependencies between WorkOrders based on default rules
 *
 * Default dependency rule v1:
 * - BACKEND WorkOrders in a module depend on nothing
 * - FRONTEND depends on BACKEND if interfaces exist
 * - QA depends on FRONTEND + BACKEND
 * - INTEGRATION depends on all domains
 */
function computeDefaultDependencies(
  workOrders: WorkOrderData[],
  moduleWorkOrders: Map<string, Map<BlueprintDomain, string>>
): void {
  for (const wo of workOrders) {
    const moduleMap = moduleWorkOrders.get(wo.moduleId);
    if (!moduleMap) continue;

    const backendKey = moduleMap.get('BACKEND');
    const frontendKey = moduleMap.get('FRONTEND');

    switch (wo.domain) {
      case 'FRONTEND':
        // FRONTEND depends on BACKEND if both exist
        if (backendKey && backendKey !== wo.key) {
          wo.dependsOnKeys.push(backendKey);
        }
        break;

      case 'QA':
        // QA depends on FRONTEND + BACKEND
        if (backendKey && backendKey !== wo.key) {
          wo.dependsOnKeys.push(backendKey);
        }
        if (frontendKey && frontendKey !== wo.key) {
          wo.dependsOnKeys.push(frontendKey);
        }
        break;

      case 'INTEGRATION':
        // INTEGRATION depends on all other domains in the module
        for (const [domain, key] of moduleMap.entries()) {
          if (key !== wo.key && domain !== 'INTEGRATION') {
            wo.dependsOnKeys.push(key);
          }
        }
        break;

      // BACKEND, DEVOPS, ALGO have no default dependencies
      default:
        break;
    }
  }
}

/**
 * Add cross-module dependencies based on depends_on_modules
 */
function addModuleDependencies(
  workOrders: WorkOrderData[],
  moduleWorkOrders: Map<string, Map<BlueprintDomain, string>>,
  spec: BlueprintSpec
): void {
  // Build module dependency map
  const moduleDeps = new Map<string, string[]>();
  for (const mod of spec.modules) {
    if (mod.depends_on_modules) {
      moduleDeps.set(mod.module_id, mod.depends_on_modules);
    }
  }

  // For each WorkOrder, add dependencies from dependent modules
  for (const wo of workOrders) {
    const deps = moduleDeps.get(wo.moduleId);
    if (!deps) continue;

    for (const depModuleId of deps) {
      const depModuleMap = moduleWorkOrders.get(depModuleId);
      if (!depModuleMap) continue;

      // Add dependency on same domain in dependent module
      const depKey = depModuleMap.get(wo.domain as BlueprintDomain);
      if (depKey && !wo.dependsOnKeys.includes(depKey)) {
        wo.dependsOnKeys.push(depKey);
      }
    }
  }
}

/**
 * Main Slicer function: Transform BlueprintVersion into WorkOrders
 *
 * DETERMINISTIC: Same input always produces same output
 */
export function sliceBlueprintToWorkOrders(
  specJson: unknown,
  _options: SlicerOptions
): SlicerResult {
  // Note: _options.projectId is used for context but not stored in WorkOrderData
  // The projectId is passed separately to toWorkOrderCreateInput
  const errors: string[] = [];

  // Step 1: Validate spec
  const validation = validateBlueprintSpec(specJson);
  if (!validation.valid) {
    return {
      specHash: '',
      workOrders: [],
      dependencyGraph: new Map(),
      errors: validation.errors,
    };
  }

  const spec = specJson as BlueprintSpec;
  const specHash = computeSpecHash(spec);

  // Step 2: Generate WorkOrders deterministically
  const workOrders: WorkOrderData[] = [];
  const moduleWorkOrders = new Map<string, Map<BlueprintDomain, string>>();
  let globalSeq = 1;

  // Sort modules by module_id for deterministic ordering
  const sortedModules = [...spec.modules].sort((a, b) => a.module_id.localeCompare(b.module_id));

  for (const mod of sortedModules) {
    const moduleMap = new Map<BlueprintDomain, string>();
    moduleWorkOrders.set(mod.module_id, moduleMap);

    // Sort domains for deterministic ordering
    const sortedDomains = [...mod.domains].sort() as BlueprintDomain[];

    for (const domain of sortedDomains) {
      // Skip invalid domains
      if (!VALID_DOMAINS.includes(domain)) continue;

      const key = generateWorkOrderKey(spec.blueprint_id, domain, globalSeq);
      moduleMap.set(domain, key);
      globalSeq++;

      const specIds = getSpecIdsForDomain(mod, domain);
      const ownedPaths = getOwnedPaths(mod, domain);
      const acceptanceChecks = getAcceptanceChecks(mod, domain);
      const memoryHints = generateMemoryHints(mod, domain, specIds);

      const workOrder: WorkOrderData = {
        key,
        title: `${mod.title} - ${domain}`,
        summary: `WorkOrder for ${mod.title} (${domain} domain). Implements: ${specIds.join(', ')}`,
        domain: domain as WorkOrderDomain,
        specIds,
        ownedPaths,
        interfaces: mod.interfaces || [],
        acceptanceChecks,
        assetsToUse: mod.assets_hint || [],
        memoryHints,
        moduleId: mod.module_id,
        dependsOnKeys: [],
      };

      workOrders.push(workOrder);
    }
  }

  // Step 3: Compute dependencies
  computeDefaultDependencies(workOrders, moduleWorkOrders);
  addModuleDependencies(workOrders, moduleWorkOrders, spec);

  // Build dependency graph
  const dependencyGraph = new Map<string, string[]>();
  for (const wo of workOrders) {
    // Sort dependencies for determinism
    wo.dependsOnKeys.sort();
    dependencyGraph.set(wo.key, wo.dependsOnKeys);
  }

  return {
    specHash,
    workOrders,
    dependencyGraph,
    errors,
  };
}

/**
 * Convert WorkOrderData to Prisma create input
 */
export function toWorkOrderCreateInput(
  data: WorkOrderData,
  blueprintVersionId: string,
  projectId: string,
  runId?: string
): Prisma.WorkOrderCreateInput {
  return {
    project: { connect: { id: projectId } },
    run: runId ? { connect: { id: runId } } : undefined,
    blueprintVersion: { connect: { id: blueprintVersionId } },
    key: data.key,
    title: data.title,
    summary: data.summary,
    domain: data.domain,
    status: 'PLANNED' as WorkOrderStatus,
    specIds: data.specIds,
    ownedPaths: data.ownedPaths,
    interfaces: data.interfaces,
    acceptanceChecks: data.acceptanceChecks,
    assetsToUse: data.assetsToUse,
    memoryHints: data.memoryHints,
  };
}
