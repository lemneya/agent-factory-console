import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;

    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        pullRequests: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
        },
        issues: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { pullRequests: true, issues: true },
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json(repository);
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existingRepo = await prisma.repository.findUnique({
      where: { id },
    });

    if (!existingRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      fullName,
      description,
      htmlUrl,
      cloneUrl,
      sshUrl,
      defaultBranch,
      language,
      private: isPrivate,
    } = body;

    const repository = await prisma.repository.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(fullName !== undefined && { fullName }),
        ...(description !== undefined && { description }),
        ...(htmlUrl !== undefined && { htmlUrl }),
        ...(cloneUrl !== undefined && { cloneUrl }),
        ...(sshUrl !== undefined && { sshUrl }),
        ...(defaultBranch !== undefined && { defaultBranch }),
        ...(language !== undefined && { language }),
        ...(isPrivate !== undefined && { private: isPrivate }),
      },
      include: {
        _count: {
          select: { pullRequests: true, issues: true },
        },
      },
    });

    return NextResponse.json(repository);
  } catch (error) {
    console.error('Error updating repository:', error);
    return NextResponse.json(
      { error: 'Failed to update repository' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existingRepo = await prisma.repository.findUnique({
      where: { id },
    });

    if (!existingRepo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Delete related PRs and issues first (cascade not set in schema)
    await prisma.$transaction([
      prisma.pullRequest.deleteMany({ where: { repositoryId: id } }),
      prisma.issue.deleteMany({ where: { repositoryId: id } }),
      prisma.repository.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repository:', error);
    return NextResponse.json(
      { error: 'Failed to delete repository' },
      { status: 500 }
    );
  }
}
