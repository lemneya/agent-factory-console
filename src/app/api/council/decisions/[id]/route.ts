import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/council/decisions/[id] - Get specific decision details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const decision = await prisma.councilDecision.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            kind: true,
          },
        },
      },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Council decision not found' }, { status: 404 });
    }

    return NextResponse.json(decision);
  } catch (error) {
    console.error('Error fetching Council decision:', error);
    return NextResponse.json({ error: 'Failed to fetch Council decision' }, { status: 500 });
  }
}

// DELETE /api/council/decisions/[id] - Delete a decision
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const decision = await prisma.councilDecision.findUnique({
      where: { id },
    });

    if (!decision) {
      return NextResponse.json({ error: 'Council decision not found' }, { status: 404 });
    }

    await prisma.councilDecision.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Council decision deleted' });
  } catch (error) {
    console.error('Error deleting Council decision:', error);
    return NextResponse.json({ error: 'Failed to delete Council decision' }, { status: 500 });
  }
}
