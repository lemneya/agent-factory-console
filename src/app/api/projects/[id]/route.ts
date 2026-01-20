/**
 * GET/PUT/PATCH/DELETE /api/projects/[id]
 *
 * SECURITY-0: All write operations require:
 * - Authentication (session required)
 * - Ownership verification (user must own the project)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireProjectOwnership } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        runs: {
          include: {
            tasks: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { receivedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { runs: true, events: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership
    const ownershipResult = await requireProjectOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { repoName, repoFullName, description, htmlUrl, lastUpdated } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(repoName && { repoName }),
        ...(repoFullName && { repoFullName }),
        ...(description !== undefined && { description }),
        ...(htmlUrl && { htmlUrl }),
        ...(lastUpdated && { lastUpdated: new Date(lastUpdated) }),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// AFC-RUNNER-UX-3: PATCH endpoint for repo binding
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership
    const ownershipResult = await requireProjectOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { repoOwner, repoName, baseBranch } = body;

    // Validate required fields for repo binding
    if (repoOwner !== undefined && !repoOwner) {
      return NextResponse.json({ error: 'repoOwner cannot be empty' }, { status: 400 });
    }
    if (repoName !== undefined && !repoName) {
      return NextResponse.json({ error: 'repoName cannot be empty' }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(repoOwner !== undefined && { repoOwner }),
        ...(repoName !== undefined && { repoName }),
        ...(baseBranch !== undefined && { baseBranch: baseBranch || 'main' }),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project repo config:', error);
    return NextResponse.json({ error: 'Failed to update project repo config' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership
    const ownershipResult = await requireProjectOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
