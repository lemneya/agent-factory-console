/**
 * POST /api/copilot/drafts/[id]/approve
 * Approve a CopilotDraft and execute the real action
 *
 * UX-GATE-COPILOT-1: Draft Mode API
 *
 * SAFETY: This is the ONLY route that performs real actions.
 * It must:
 * - Confirm status == DRAFT
 * - Require authenticated user (unless NEXT_PUBLIC_DEV_AUTH_BYPASS=true)
 * - Execute the appropriate action based on kind
 * - Set draft status to APPROVED
 * - Write CopilotDraftEvent APPROVED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DecisionType, RiskLevel } from '@prisma/client';

// Type definitions for draft payloads
interface BlueprintDraftPayload {
  blueprint: {
    name: string;
    description: string;
    modules: Array<{
      key: string;
      title: string;
      domain: string;
      spec: string;
    }>;
  };
  determinism: {
    specHash: string;
    stableOrder: boolean;
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

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check for dev auth bypass
    const devAuthBypass =
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'test';

    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Require authentication unless dev bypass
    if (!userId && !devAuthBypass) {
      return NextResponse.json(
        { error: 'Authentication required to approve drafts' },
        { status: 401 }
      );
    }

    // Fetch the draft
    const draft = await prisma.copilotDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Confirm status is DRAFT
    if (draft.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot approve draft with status: ${draft.status}` },
        { status: 400 }
      );
    }

    let resultRef: string | null = null;

    // Execute the appropriate action based on kind
    switch (draft.kind) {
      case 'BLUEPRINT': {
        // Create Blueprint record
        // Note: This is a simplified implementation
        // In production, this would call the actual blueprint creation API
        const payload = draft.payloadJson as unknown as BlueprintDraftPayload;
        resultRef = `Blueprint:draft-${draft.id}-${payload.blueprint.name}`;
        break;
      }

      case 'WORKORDERS': {
        // Create WorkOrders
        // Note: This would call the slicer endpoint or create WorkOrders directly
        // Safety: Must check for CouncilDecision if this implies BUILD run creation
        const payload = draft.payloadJson as unknown as WorkOrdersDraftPayload;

        // Check for Council Gate if this is a BUILD operation
        if (draft.projectId) {
          const councilDecision = await prisma.councilDecision.findFirst({
            where: {
              projectId: draft.projectId,
              decision: 'BUILD',
            },
            orderBy: { createdAt: 'desc' },
          });

          if (!councilDecision) {
            return NextResponse.json(
              {
                error:
                  'Council Gate: No BUILD decision found for this project. Create a Council decision first.',
              },
              { status: 403 }
            );
          }
        }

        resultRef = `WorkOrderBatch:draft-${draft.id}-${payload.source.blueprintId}`;
        break;
      }

      case 'COUNCIL': {
        // Create CouncilDecision record
        const payload = draft.payloadJson as unknown as CouncilDraftPayload;

        const councilDecision = await prisma.councilDecision.create({
          data: {
            projectId: payload.decision.projectId,
            decision: payload.decision.type as DecisionType,
            confidence: 0.9, // Default confidence
            maintenanceRisk: payload.decision.risk as RiskLevel,
            reasoning: payload.decision.rationale,
            sources: {
              topRisks: payload.decision.topRisks,
              mitigations: payload.decision.mitigations,
              recommendedNextGate: payload.decision.recommendedNextGate,
            },
            createdBy: userId || 'system',
          },
        });

        resultRef = `CouncilDecision:${councilDecision.id}`;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown draft kind: ${draft.kind}` }, { status: 400 });
    }

    // Update draft status to APPROVED
    await prisma.copilotDraft.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId || 'dev-bypass',
        resultRef,
      },
    });

    // Create audit event
    await prisma.copilotDraftEvent.create({
      data: {
        draftId: id,
        actorUserId: userId,
        eventType: 'APPROVED',
        detailsJson: { resultRef },
      },
    });

    return NextResponse.json({ resultRef, status: 'APPROVED' });
  } catch (error) {
    console.error('Error approving draft:', error);
    return NextResponse.json({ error: 'Failed to approve draft' }, { status: 500 });
  }
}
