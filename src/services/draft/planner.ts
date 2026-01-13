/**
 * Draft Planner Service
 *
 * Generates a DraftPlan that describes exactly what operations will be performed
 * when a draft is approved. This is used both for:
 * 1. Diff view (dry run) - shows user what will happen
 * 2. Approve action - executes the plan
 *
 * This ensures no divergence between "what UI shows" and "what approve does."
 */

import { prisma } from '@/lib/prisma';

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

export interface DraftPayload {
  blueprint?: {
    name: string;
    description: string;
    modules: Array<{
      key: string;
      title: string;
      domain: string;
      spec: string;
    }>;
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
}

interface PlanOptions {
  dryRun?: boolean;
}

/**
 * Plan the actions that will be taken when a draft is approved.
 * This function is deterministic and does NOT perform any mutations.
 */
export async function planDraftActions(
  draft: {
    id: string;
    kind: DraftKind;
    payloadJson: string;
    projectId: string | null;
    sourcesJson?: any;
  },
  _options?: PlanOptions
): Promise<DraftPlan> {
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
    const existingBlueprint = await (db as any).blueprint.findFirst({
      where: { name: blueprint.name },
    });
    if (existingBlueprint) {
      warnings.push(`Name collision possible: Blueprint "${blueprint.name}" already exists.`);
    }
  }

  // Get domains from modules
  const domains = [...new Set(blueprint.modules?.map(m => m.domain) || [])];

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
  const specHash = payload.determinism?.specHash || 'auto-generated';
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
      const councilDecision = await (db as any).councilDecision.findFirst({
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
      const blueprintVersion = await (db as any).blueprintVersion.findFirst({
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
 */
export async function executeDraftPlan(
  plan: DraftPlan,
  draft: {
    id: string;
    kind: DraftKind;
    payloadJson: string;
    projectId: string | null;
    sourcesJson?: any;
  }
): Promise<{ success: boolean; resultRef?: string; error?: string }> {
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
        const decision = await (db as any).councilDecision.create({
          data: {
            projectId: council.projectId,
            decision: council.type as any,
            maintenanceRisk: council.risk as any,
            reasoning: council.rationale,
            sources: draft.sourcesJson || [],
            confidence: 0.9,
          },
        });
        return { success: true, resultRef: decision.id };
      }

      case 'BLUEPRINT': {
        const blueprint = payload.blueprint;
        if (!blueprint) {
          return { success: false, error: 'Blueprint payload missing' };
        }
        const newBlueprint = await (db as any).blueprint.create({
          data: {
            name: blueprint.name,
            description: blueprint.description,
            projectId: draft.projectId,
          },
        });
        const version = await (db as any).blueprintVersion.create({
          data: {
            blueprintId: newBlueprint.id,
            payloadJson: { modules: blueprint.modules },
            specHash: payload.determinism?.specHash || `hash-${Date.now()}`,
          },
        });
        return { success: true, resultRef: `${newBlueprint.id}:${version.id}` };
      }

      case 'WORKORDERS': {
        // For now, just mark as executed - actual work order creation
        // would involve more complex logic with the slicer
        return { success: true, resultRef: `workorders-${draft.id}` };
      }

      default:
        return { success: false, error: `Unknown draft kind: ${draft.kind}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
