import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/council/decisions/[id]/override - Override a decision with justification
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      decision,
      confidence,
      candidateName,
      candidateUrl,
      licenseType,
      maintenanceRisk,
      integrationPlan,
      redTeamCritique,
      sources,
      reasoning,
      overrideReason,
      createdBy,
    } = body;

    // Get the original decision
    const originalDecision = await prisma.councilDecision.findUnique({
      where: { id },
    });

    if (!originalDecision) {
      return NextResponse.json({ error: 'Original Council decision not found' }, { status: 404 });
    }

    // Validate required fields
    if (!decision || !['ADOPT', 'ADAPT', 'BUILD'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be ADOPT, ADAPT, or BUILD' },
        { status: 400 }
      );
    }
    if (!overrideReason) {
      return NextResponse.json({ error: 'overrideReason is required' }, { status: 400 });
    }
    if (confidence === undefined || confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: 'confidence must be a number between 0 and 1' },
        { status: 400 }
      );
    }
    if (!maintenanceRisk || !['LOW', 'MEDIUM', 'HIGH'].includes(maintenanceRisk)) {
      return NextResponse.json(
        { error: 'maintenanceRisk must be LOW, MEDIUM, or HIGH' },
        { status: 400 }
      );
    }
    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json({ error: 'sources must be an array' }, { status: 400 });
    }
    if (!reasoning) {
      return NextResponse.json({ error: 'reasoning is required' }, { status: 400 });
    }

    // Create new decision that overrides the original
    const newDecision = await prisma.councilDecision.create({
      data: {
        projectId: originalDecision.projectId,
        taskId: originalDecision.taskId,
        decision,
        confidence,
        candidateName,
        candidateUrl,
        licenseType,
        maintenanceRisk,
        integrationPlan,
        redTeamCritique,
        sources,
        reasoning,
        overrideOf: id,
        overrideReason,
        createdBy,
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(newDecision, { status: 201 });
  } catch (error) {
    console.error('Error overriding Council decision:', error);
    return NextResponse.json({ error: 'Failed to override Council decision' }, { status: 500 });
  }
}
