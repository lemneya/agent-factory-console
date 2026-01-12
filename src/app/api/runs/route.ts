import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const runs = await prisma.run.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status }),
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, status, skipCouncilCheck } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    // AFC-1.3: Council Gate - require a decision before BUILD runs
    // Only enforce if not explicitly skipped (e.g., for non-build runs)
    if (!skipCouncilCheck) {
      const councilDecision = await prisma.councilDecision.findFirst({
        where: {
          projectId,
          decision: { in: ['ADOPT', 'ADAPT', 'BUILD'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!councilDecision) {
        return NextResponse.json(
          {
            error: 'Council decision required',
            message:
              'No Council decision exists for this project. Create a Council evaluation before starting a BUILD run.',
            code: 'COUNCIL_DECISION_REQUIRED',
          },
          { status: 409 }
        );
      }
    }

    // AFC-1.1: Create run first, then set threadId = id (threadId binding rule)
    const run = await prisma.run.create({
      data: {
        projectId,
        name,
        status: status || 'ACTIVE',
        threadId: '', // Placeholder, will be updated
      },
    });

    // AFC-1.1: threadId MUST equal runId always
    const updatedRun = await prisma.run.update({
      where: { id: run.id },
      data: { threadId: run.id },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRun, { status: 201 });
  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });
  }
}
