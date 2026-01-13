/**
 * GET /api/copilot/drafts
 * List CopilotDraft records with optional filters
 *
 * UX-GATE-COPILOT-1: Draft Mode API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CopilotDraftKind, CopilotDraftStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: {
      kind?: CopilotDraftKind;
      status?: CopilotDraftStatus;
      projectId?: string;
    } = {};

    if (kind && ['BLUEPRINT', 'WORKORDERS', 'COUNCIL'].includes(kind)) {
      where.kind = kind as CopilotDraftKind;
    }

    if (status && ['DRAFT', 'APPROVED', 'REJECTED', 'EXPIRED'].includes(status)) {
      where.status = status as CopilotDraftStatus;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // Fetch drafts
    const [drafts, total] = await Promise.all([
      prisma.copilotDraft.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          projectId: true,
          runId: true,
          kind: true,
          status: true,
          title: true,
          approvedAt: true,
          approvedBy: true,
          resultRef: true,
        },
      }),
      prisma.copilotDraft.count({ where }),
    ]);

    return NextResponse.json({
      drafts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error listing drafts:', error);
    return NextResponse.json({ error: 'Failed to list drafts' }, { status: 500 });
  }
}
