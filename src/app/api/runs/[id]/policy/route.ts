import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/runs/[id]/policy - Get run policy
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const run = await prisma.run.findUnique({
      where: { id },
      include: { policy: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Return existing policy or default values
    const policy = run.policy || {
      maxIterations: 25,
      autoAbortOnFailure: true,
      requireHumanReview: false,
    };

    return NextResponse.json({ runId: id, policy });
  } catch (error) {
    console.error('Error fetching run policy:', error);
    return NextResponse.json({ error: 'Failed to fetch run policy' }, { status: 500 });
  }
}

// PUT /api/runs/[id]/policy - Update run policy
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const run = await prisma.run.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Validate policy fields
    const { maxIterations, autoAbortOnFailure, requireHumanReview } = body;

    // Upsert policy
    const policy = await prisma.runPolicy.upsert({
      where: { runId: id },
      update: {
        ...(maxIterations !== undefined && { maxIterations }),
        ...(autoAbortOnFailure !== undefined && { autoAbortOnFailure }),
        ...(requireHumanReview !== undefined && { requireHumanReview }),
      },
      create: {
        runId: id,
        maxIterations: maxIterations ?? 25,
        autoAbortOnFailure: autoAbortOnFailure ?? true,
        requireHumanReview: requireHumanReview ?? false,
      },
    });

    return NextResponse.json({ runId: id, policy });
  } catch (error) {
    console.error('Error updating run policy:', error);
    return NextResponse.json({ error: 'Failed to update run policy' }, { status: 500 });
  }
}
