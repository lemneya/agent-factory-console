/**
 * GET /api/copilot/drafts/[id]/diff
 *
 * Returns the DraftPlan showing exactly what operations will be performed
 * when the draft is approved. This is a read-only endpoint - no mutations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { planDraftActions, DraftKind } from '@/services/draft/planner';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check for demo mode
  const isDemo = request.nextUrl.searchParams.get('demo') === '1';

  // Auth check (unless demo mode)
  if (!isDemo) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = prisma;
  if (!db) {
    // Demo mode - return mock plan
    return NextResponse.json(getMockPlan(id));
  }

  try {
    const draft = await db.copilotDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Generate the plan (dry run - no mutations)
    const plan = await planDraftActions({
      id: draft.id,
      kind: draft.kind as DraftKind,
      payloadJson: draft.payloadJson as string,
      projectId: draft.projectId,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error generating draft plan:', error);
    return NextResponse.json({ error: 'Failed to generate draft plan' }, { status: 500 });
  }
}

/**
 * Mock plan for demo mode
 */
function getMockPlan(draftId: string) {
  return {
    draftId,
    kind: 'BLUEPRINT',
    operations: [
      {
        op: 'CREATE',
        model: 'Blueprint',
        ref: `draft-${draftId}-blueprint`,
        summary: 'Create Blueprint: Demo Blueprint',
        fieldsPreview: {
          name: 'Demo Blueprint',
          description: 'A demonstration blueprint...',
          moduleCount: 4,
          domains: 'auth, data, api, ui',
        },
        warnings: [],
      },
      {
        op: 'CREATE',
        model: 'BlueprintVersion',
        ref: `draft-${draftId}-version`,
        summary: 'Create BlueprintVersion (immutable payload)',
        fieldsPreview: {
          specHash: 'demo-hash-12345',
          stableOrder: true,
          moduleCount: 4,
        },
        warnings: [],
      },
    ],
    checks: {
      councilRequired: false,
      councilSatisfied: false,
      willCreateCount: {
        Blueprint: 1,
        BlueprintVersion: 1,
      },
    },
  };
}
