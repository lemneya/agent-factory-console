/**
 * Draft Planner Service
 *
 * Generates a DraftPlan that describes exactly what operations will be performed
 * when a draft is approved. This is used both for:
 * 1. Diff view (dry run) - shows user what will happen
 * 2. Approve action - executes the plan
 *
 * This ensures no divergence between "what UI shows" and "what approve does."
 *
 * UX-GATE-COPILOT-2: Enhanced with deterministic Blueprint → WorkOrder pipeline
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Helper to get prisma client (returns null if not available)
const getPrisma = () => prisma;

// Types
export type DraftKind = 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';
export type OperationType = 'CREATE' | 'UPDATE' | 'CALL_API';

export interface DraftOperation {
  op: OperationType;
  model: string;
  ref: string;
  summary: string;
  fieldsPreview: Record<string, unknown>;
  warnings: string[];
}

export interface DraftChecks {
  councilRequired: boolean;
  councilSatisfied: boolean;
  willCreateCount: Record<string, number>;
}

export interface DraftPlan {
  draftId: string;
  kind: DraftKind;
  operations: DraftOperation[];
  checks: DraftChecks;
}

export interface BlueprintModule {
  key: string;
  title: string;
  domain: string;
  spec: string;
}

export interface DraftPayload {
  blueprint?: {
    name: string;
    description: string;
    modules: BlueprintModule[];
  };
  determinism?: {
    specHash: string;
    stableOrder: boolean;
  };
  source?: {
    blueprintId: string;
    versionId: string | null;
  };
  slice?: {
    policy: {
      domainOrder: string[];
      maxItems: number;
    };
  };
  council?: {
    projectId: string;
    type: string;
    risk: string;
    rationale: string;
    risks: string[];
    mitigations: string[];
  };
  // UX-GATE-COPILOT-2: Options for post-approval actions
  options?: {
    startRunAfterApproval?: boolean;
    createWorkOrdersAfterApproval?: boolean;
  };
}

/**
 * Generate a deterministic hash for a blueprint specification
 * This ensures the same spec always produces the same hash
 */
export function generateSpecHash(modules: BlueprintModule[]): string {
  // Sort modules by key for determinism
  const sortedModules = [...modules].sort((a, b) => a.key.localeCompare(b.key));
  const canonical = JSON.stringify(sortedModules);
  return crypto.createHash('sha256').update(canonical).digest('hex').substring(0, 16);
}

/**
 * Plan the actions that will be taken when a draft is approved.
 * This function is deterministic and does NOT perform any mutations.
 */
export async function planDraftActions(draft: {
  id: string;
  kind: DraftKind;
  payloadJson: string;
  projectId: string | null;
  sourcesJson?: unknown;
}): Promise<DraftPlan> {
  const payload: DraftPayload = JSON.parse(draft.payloadJson);
  const operations: DraftOperation[] = [];
  const checks: DraftChecks = {
    councilRequired: false,
    councilSatisfied: false,
    willCreateCount: {},
  };

  switch (draft.kind) {
    case 'COUNCIL':
      await planCouncilDraft(draft, payload, operations, checks);
      break;
    case 'BLUEPRINT':
      await planBlueprintDraft(draft, payload, operations, checks);
      break;
    case 'WORKORDERS':
      await planWorkOrdersDraft(draft, payload, operations, checks);
      break;
  }

  return {
    draftId: draft.id,
    kind: draft.kind,
    operations,
    checks,
  };
}

/**
 * Plan COUNCIL draft operations
 */
async function planCouncilDraft(
  draft: { id: string; projectId: string | null },
  payload: DraftPayload,
  operations: DraftOperation[],
  checks: DraftChecks
): Promise<void> {
  const council = payload.council;
  if (!council) {
    operations.push({
      op: 'CREATE',
      model: 'CouncilDecision',
      ref: `draft-${draft.id}`,
      summary: 'Missing council payload',
      fieldsPreview: {},
      warnings: ['Council payload is missing from draft'],
    });
    return;
  }

  const db = getPrisma();
  const warnings: string[] = [];

  // Check for existing decisions
  if (db && council.projectId) {
    const existingDecisions = await db.councilDecision.count({
      where: { projectId: council.projectId },
    });
    if (existingDecisions > 0) {
      warnings.push(
        `Existing decisions found (${existingDecisions}); this will add another record.`
      );
    }
  }

  operations.push({
    op: 'CREATE',
    model: 'CouncilDecision',
    ref: `draft-${draft.id}`,
    summary: `Create Council Decision: ${council.type} (${council.risk} risk)`,
    fieldsPreview: {
      projectId: council.projectId,
      type: council.type,
      risk: council.risk,
      rationale: council.rationale?.substring(0, 100) + '...',
      risksCount: council.risks?.length || 0,
      mitigationsCount: council.mitigations?.length || 0,
    },
    warnings,
  });

  checks.willCreateCount['CouncilDecision'] = 1;
  // Council draft satisfies Council requirement, not requires it
  checks.councilRequired = false;
}

/**
 * Plan BLUEPRINT draft operations
 * UX-GATE-COPILOT-2: Enhanced with deterministic spec hash and optional WorkOrder creation
 */
async function planBlueprintDraft(
  draft: { id: string; projectId: string | null },
  payload: DraftPayload,
  operations: DraftOperation[],
  checks: DraftChecks
): Promise<void> {
  const blueprint = payload.blueprint;
  if (!blueprint) {
    operations.push({
      op: 'CREATE',
      model: 'Blueprint',
      ref: `draft-${draft.id}`,
      summary: 'Missing blueprint payload',
      fieldsPreview: {},
      warnings: ['Blueprint payload is missing from draft'],
    });
    return;
  }

  const db = getPrisma();
  const warnings: string[] = [];

  // Check for name collision
  if (db && blueprint.name) {
    const existingBlueprint = await db.blueprint.findFirst({
      where: { name: blueprint.name },
    });
    if (existingBlueprint) {
      warnings.push(`Name collision possible: Blueprint "${blueprint.name}" already exists.`);
    }
  }

  // Get domains from modules
  const domains = [...new Set(blueprint.modules?.map(m => m.domain) || [])];

  // Generate deterministic spec hash
  const specHash = payload.determinism?.specHash || generateSpecHash(blueprint.modules || []);

  operations.push({
    op: 'CREATE',
    model: 'Blueprint',
    ref: `draft-${draft.id}-blueprint`,
    summary: `Create Blueprint: ${blueprint.name}`,
    fieldsPreview: {
      name: blueprint.name,
      description: blueprint.description?.substring(0, 100) + '...',
      moduleCount: blueprint.modules?.length || 0,
      domains: domains.join(', '),
    },
    warnings,
  });

  // Blueprint version
  operations.push({
    op: 'CREATE',
    model: 'BlueprintVersion',
    ref: `draft-${draft.id}-version`,
    summary: `Create BlueprintVersion (immutable payload)`,
    fieldsPreview: {
      specHash,
      stableOrder: payload.determinism?.stableOrder ?? true,
      moduleCount: blueprint.modules?.length || 0,
    },
    warnings: [],
  });

  checks.willCreateCount['Blueprint'] = 1;
  checks.willCreateCount['BlueprintVersion'] = 1;

  // UX-GATE-COPILOT-2: If createWorkOrdersAfterApproval is set, plan WorkOrder creation
  if (payload.options?.createWorkOrdersAfterApproval && blueprint.modules) {
    const moduleCount = blueprint.modules.length;
    operations.push({
      op: 'CREATE',
      model: 'WorkOrder',
      ref: `draft-${draft.id}-workorders`,
      summary: `Create ${moduleCount} WorkOrders from Blueprint modules`,
      fieldsPreview: {
        count: moduleCount,
        domains: domains.join(', '),
        stableKeys: true,
      },
      warnings: [],
    });
    checks.willCreateCount['WorkOrder'] = moduleCount;
  }

  checks.councilRequired = false;
}

/**
 * Plan WORKORDERS draft operations
 */
async function planWorkOrdersDraft(
  draft: { id: string; projectId: string | null },
  payload: DraftPayload,
  operations: DraftOperation[],
  checks: DraftChecks
): Promise<void> {
  const source = payload.source;
  const slice = payload.slice;
  const warnings: string[] = [];

  // Check for missing blueprint reference
  if (!source?.blueprintId) {
    warnings.push('WorkOrders draft missing blueprint ref.');
  }

  const db = getPrisma();

  // Check Council Gate
  if (draft.projectId) {
    checks.councilRequired = true;
    if (db) {
      const councilDecision = await db.councilDecision.findFirst({
        where: { projectId: draft.projectId },
      });
      checks.councilSatisfied = !!councilDecision;

      if (!councilDecision) {
        warnings.push('Council Gate would block downstream BUILD runs. No Council Decision found.');
      }
    }
  }

  // If using slicer
  if (slice) {
    operations.push({
      op: 'CALL_API',
      model: 'BlueprintSlicer',
      ref: `draft-${draft.id}-slice`,
      summary: `Call Blueprint Slicer API`,
      fieldsPreview: {
        blueprintId: source?.blueprintId || 'unknown',
        versionId: source?.versionId || 'latest',
        domainOrder: slice.policy?.domainOrder?.join(', ') || 'default',
        maxItems: slice.policy?.maxItems || 'unlimited',
      },
      warnings: [],
    });
  }

  // Estimate work order count based on blueprint modules
  let estimatedWorkOrders = 6; // Default estimate
  if (db && source?.blueprintId) {
    try {
      const blueprintVersion = await db.blueprintVersion.findFirst({
        where: { blueprintId: source.blueprintId },
        orderBy: { createdAt: 'desc' },
      });
      if (blueprintVersion) {
        const versionPayload = blueprintVersion.payloadJson as { modules?: unknown[] };
        if (versionPayload?.modules) {
          estimatedWorkOrders = versionPayload.modules.length;
        }
      }
    } catch {
      // Ignore errors, use default estimate
    }
  }

  operations.push({
    op: 'CREATE',
    model: 'WorkOrder',
    ref: `draft-${draft.id}-workorders`,
    summary: `Create WorkOrders from Blueprint`,
    fieldsPreview: {
      blueprintId: source?.blueprintId || 'unknown',
      versionId: source?.versionId || 'latest',
      estimatedCount: estimatedWorkOrders,
      stableKeys: true,
    },
    warnings,
  });

  checks.willCreateCount['WorkOrder'] = estimatedWorkOrders;
}

/**
 * Execute a draft plan (perform the actual mutations)
 * This is called by the approve route after planDraftActions
 *
 * UX-GATE-COPILOT-2: Enhanced with deterministic WorkOrder creation
 */
export async function executeDraftPlan(
  plan: DraftPlan,
  draft: {
    id: string;
    kind: DraftKind;
    payloadJson: string;
    projectId: string | null;
    sourcesJson?: unknown;
  }
): Promise<{
  success: boolean;
  resultRef?: string;
  error?: string;
  blueprintId?: string;
  versionId?: string;
  workOrderIds?: string[];
}> {
  const db = getPrisma();
  if (!db) {
    return { success: false, error: 'Database not available' };
  }

  const payload: DraftPayload = JSON.parse(draft.payloadJson);

  try {
    switch (draft.kind) {
      case 'COUNCIL': {
        const council = payload.council;
        if (!council) {
          return { success: false, error: 'Council payload missing' };
        }
        const decision = await db.councilDecision.create({
          data: {
            projectId: council.projectId,
            decision: council.type as string,
            rationale: council.rationale,
            evidenceJson: draft.sourcesJson || [],
          },
        });
        return { success: true, resultRef: decision.id };
      }

      case 'BLUEPRINT': {
        const blueprint = payload.blueprint;
        if (!blueprint) {
          return { success: false, error: 'Blueprint payload missing' };
        }

        // Generate deterministic spec hash
        const specHash = payload.determinism?.specHash || generateSpecHash(blueprint.modules || []);

        // Create Blueprint
        const newBlueprint = await db.blueprint.create({
          data: {
            name: blueprint.name,
            description: blueprint.description,
            projectId: draft.projectId,
          },
        });

        // Create BlueprintVersion with immutable payload
        const version = await db.blueprintVersion.create({
          data: {
            blueprintId: newBlueprint.id,
            payloadJson: JSON.parse(JSON.stringify({ modules: blueprint.modules })),
            specHash,
          },
        });

        const result: {
          success: boolean;
          resultRef: string;
          blueprintId: string;
          versionId: string;
          workOrderIds?: string[];
        } = {
          success: true,
          resultRef: `Blueprint:${newBlueprint.id}:${version.id}`,
          blueprintId: newBlueprint.id,
          versionId: version.id,
        };

        // UX-GATE-COPILOT-2: Create WorkOrders if option is set
        if (payload.options?.createWorkOrdersAfterApproval && blueprint.modules) {
          const workOrderIds: string[] = [];

          // Sort modules by domain for deterministic order
          const sortedModules = [...blueprint.modules].sort((a, b) => {
            // First by domain, then by key
            const domainCompare = a.domain.localeCompare(b.domain);
            if (domainCompare !== 0) return domainCompare;
            return a.key.localeCompare(b.key);
          });

          for (const blueprintModule of sortedModules) {
            const workOrder = await db.workOrder.create({
              data: {
                blueprintId: newBlueprint.id,
                blueprintVersionId: version.id,
                key: blueprintModule.key,
                domain: blueprintModule.domain,
                title: blueprintModule.title,
                spec: blueprintModule.spec,
                dependsOn: [], // Could be enhanced to parse dependencies from spec
                status: 'PENDING',
              },
            });
            workOrderIds.push(workOrder.id);
          }

          result.workOrderIds = workOrderIds;
          result.resultRef = `Blueprint:${newBlueprint.id}:${version.id}:WorkOrders:${workOrderIds.length}`;
        }

        return result;
      }

      case 'WORKORDERS': {
        const source = payload.source;
        if (!source?.blueprintId) {
          return { success: false, error: 'Blueprint reference missing' };
        }

        // Get the latest blueprint version
        const blueprintVersion = await db.blueprintVersion.findFirst({
          where: {
            blueprintId: source.blueprintId,
            ...(source.versionId ? { id: source.versionId } : {}),
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!blueprintVersion) {
          return { success: false, error: 'Blueprint version not found' };
        }

        const versionPayload = blueprintVersion.payloadJson as { modules?: BlueprintModule[] };
        const modules = versionPayload?.modules || [];

        const workOrderIds: string[] = [];

        // Sort modules for deterministic order
        const sortedModules = [...modules].sort((a, b) => {
          const domainCompare = a.domain.localeCompare(b.domain);
          if (domainCompare !== 0) return domainCompare;
          return a.key.localeCompare(b.key);
        });

        for (const blueprintModule of sortedModules) {
          const workOrder = await db.workOrder.create({
            data: {
              blueprintId: source.blueprintId,
              blueprintVersionId: blueprintVersion.id,
              key: blueprintModule.key,
              domain: blueprintModule.domain,
              title: blueprintModule.title,
              spec: blueprintModule.spec,
              dependsOn: [],
              status: 'PENDING',
            },
          });
          workOrderIds.push(workOrder.id);
        }

        return {
          success: true,
          resultRef: `WorkOrders:${workOrderIds.length}`,
          workOrderIds,
        };
      }

      default:
        return { success: false, error: `Unknown draft kind: ${draft.kind}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
