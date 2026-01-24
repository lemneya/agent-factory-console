/**
 * GET/PUT/DELETE /api/tasks/[id]
 *
 * SECURITY-0: All write operations require:
 * - Authentication (session required)
 * - Ownership verification (user must own the task via run -> project chain)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireTaskOwnership } from '@/lib/auth-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            status: true,
            project: {
              select: {
                id: true,
                repoName: true,
                repoFullName: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via run -> project chain)
    const ownershipResult = await requireTaskOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { title, description, status, priority, assignee, kind } = body;

    // Validate kind if provided
    const VALID_KINDS = ['INTEGRATE_ASSET', 'BUILD_CUSTOM', 'RESEARCH', 'QA', 'QUICK_CHANGE', 'FIX_BUG', 'SPEC_BUILD', 'FULL_SDD'];
    if (kind && !VALID_KINDS.includes(kind)) {
      return NextResponse.json({ error: `Invalid kind. Must be one of: ${VALID_KINDS.join(', ')}` }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignee !== undefined && { assignee }),
        ...(kind && { kind }),
      },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                repoName: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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

    // SECURITY-0: Verify ownership (via run -> project chain)
    const ownershipResult = await requireTaskOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
