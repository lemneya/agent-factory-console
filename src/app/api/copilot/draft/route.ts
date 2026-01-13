/**
 * POST /api/copilot/draft
 * Create a new CopilotDraft record
 *
 * UX-GATE-COPILOT-1: Draft Mode API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CopilotDraftKind } from '@prisma/client';

// Draft payload schemas for validation
interface BlueprintDraftPayload {
  blueprint: {
    name: string;
    description: string;
    modules: Array<{
      key: string;
      title: string;
      domain: 'frontend' | 'backend' | 'infra' | 'qa';
      spec: string;
    }>;
  };
  determinism: {
    specHash: string;
    stableOrder: boolean;
  };
}

interface WorkOrdersDraftPayload {
  source: {
    blueprintId: string;
    versionId: string | null;
  };
  slice: {
    policy: {
      domainOrder: string[];
      maxItems: number;
    };
    workorders: Array<{
      key: string;
      domain: string;
      title: string;
      dependsOn: string[];
    }>;
  };
}

interface CouncilDraftPayload {
  decision: {
    projectId: string;
    type: 'ADOPT' | 'ADAPT' | 'BUILD';
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    rationale: string;
    topRisks: string[];
    mitigations: string[];
    recommendedNextGate: string;
  };
}

type DraftPayload = BlueprintDraftPayload | WorkOrdersDraftPayload | CouncilDraftPayload;

interface CreateDraftRequest {
  kind: 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';
  title: string;
  payload: DraftPayload;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  projectId?: string | null;
  runId?: string | null;
  demoMode?: boolean;
}

function validatePayload(kind: string, payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;

  switch (kind) {
    case 'BLUEPRINT': {
      const bp = payload as BlueprintDraftPayload;
      return !!(bp.blueprint?.name && bp.blueprint?.modules && Array.isArray(bp.blueprint.modules));
    }
    case 'WORKORDERS': {
      const wo = payload as WorkOrdersDraftPayload;
      return !!(
        wo.source?.blueprintId &&
        wo.slice?.workorders &&
        Array.isArray(wo.slice.workorders)
      );
    }
    case 'COUNCIL': {
      const cd = payload as CouncilDraftPayload;
      return !!(
        cd.decision?.projectId &&
        cd.decision?.type &&
        cd.decision?.risk &&
        cd.decision?.rationale
      );
    }
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateDraftRequest;
    const { kind, title, payload, sources, projectId, runId, demoMode } = body;

    // Validate required fields
    if (!kind || !title || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: kind, title, payload' },
        { status: 400 }
      );
    }

    // Validate kind enum
    if (!['BLUEPRINT', 'WORKORDERS', 'COUNCIL'].includes(kind)) {
      return NextResponse.json(
        { error: 'Invalid kind. Must be BLUEPRINT, WORKORDERS, or COUNCIL' },
        { status: 400 }
      );
    }

    // Validate payload schema
    if (!validatePayload(kind, payload)) {
      return NextResponse.json(
        { error: `Invalid payload schema for ${kind} draft` },
        { status: 400 }
      );
    }

    // Get user session (optional for demo mode)
    let userId: string | null = null;
    if (!demoMode) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id || null;
    }

    // Create draft record
    const draft = await prisma.copilotDraft.create({
      data: {
        userId,
        projectId: projectId || null,
        runId: runId || null,
        kind: kind as CopilotDraftKind,
        title,
        payloadJson: payload as object,
        sourcesJson: sources ? (sources as object) : undefined,
      },
    });

    // Create audit event
    await prisma.copilotDraftEvent.create({
      data: {
        draftId: draft.id,
        actorUserId: userId,
        eventType: 'CREATED',
        detailsJson: { demoMode: !!demoMode },
      },
    });

    return NextResponse.json({ draftId: draft.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}
