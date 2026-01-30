/**
 * SECURITY-0: Authentication & Authorization Helpers
 *
 * This module provides consistent auth and ownership checks for all write endpoints.
 *
 * Usage:
 *   const authResult = await requireAuth();
 *   if (authResult.error) return authResult.error;
 *   const { userId } = authResult;
 *
 *   const ownershipResult = await requireProjectOwnership(projectId, userId);
 *   if (ownershipResult.error) return ownershipResult.error;
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Check if running in a test/dev bypass context.
 *
 * SECURITY: This should ONLY be enabled in test environments.
 * The NEXT_PUBLIC_DEV_AUTH_BYPASS should NEVER be set in production.
 *
 * Bypass conditions (explicit opt-in only):
 * - NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' (set explicitly in Playwright config for E2E)
 * - NODE_ENV === 'test' (Jest unit tests)
 *
 * NOTE: CI alone does NOT enable bypass. E2E tests set NEXT_PUBLIC_DEV_AUTH_BYPASS explicitly.
 */
export function isDevAuthBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV === 'test';
}

export interface AuthResult {
  userId: string;
  error?: never;
}

export interface AuthError {
  userId?: never;
  error: NextResponse;
}

/**
 * Require authentication for a request.
 * Returns the authenticated user ID or an error response.
 *
 * In dev/test/CI bypass mode, returns a placeholder user ID.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const devAuthBypass = isDevAuthBypass();

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id || session.user.email : null;

  if (!userId && !devAuthBypass) {
    return {
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  // In dev bypass mode without session, use placeholder
  const effectiveUserId = userId || 'dev-bypass-user';

  return { userId: effectiveUserId };
}

/**
 * Check if a user owns a project.
 * Returns success or an error response.
 *
 * In dev/test/CI bypass mode, ownership checks are skipped.
 */
export async function requireProjectOwnership(
  projectId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return {
      error: NextResponse.json({ error: 'Project not found' }, { status: 404 }),
    };
  }

  if (project.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this project' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}

/**
 * Check if a user owns a task (via run -> project ownership chain).
 * Returns success or an error response.
 */
export async function requireTaskOwnership(
  taskId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      run: {
        select: {
          project: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!task) {
    return {
      error: NextResponse.json({ error: 'Task not found' }, { status: 404 }),
    };
  }

  if (task.run.project.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this task' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}

/**
 * Check if a user owns a copilot draft.
 * Returns success or an error response.
 */
export async function requireDraftOwnership(
  draftId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const draft = await prisma.copilotDraft.findUnique({
    where: { id: draftId },
    select: { userId: true },
  });

  if (!draft) {
    return {
      error: NextResponse.json({ error: 'Draft not found' }, { status: 404 }),
    };
  }

  // Allow if draft has no owner (demo mode) or if user matches
  if (draft.userId && draft.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this draft' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}

/**
 * Check if a user owns a council decision (via project ownership).
 * Returns success or an error response.
 */
export async function requireCouncilDecisionOwnership(
  decisionId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const decision = await prisma.councilDecision.findUnique({
    where: { id: decisionId },
    select: {
      project: {
        select: { userId: true },
      },
    },
  });

  if (!decision) {
    return {
      error: NextResponse.json({ error: 'Council decision not found' }, { status: 404 }),
    };
  }

  if (decision.project.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this council decision' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}

/**
 * Check if a user owns a work order (via blueprint -> project chain, if exists).
 * Work orders without a projectId are considered shared/system resources
 * and require authentication but not ownership.
 */
export async function requireWorkOrderOwnership(
  workOrderId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: {
      blueprint: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!workOrder) {
    return {
      error: NextResponse.json({ error: 'Work order not found' }, { status: 404 }),
    };
  }

  // If work order has a project via blueprint, check ownership
  if (workOrder.blueprint?.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: workOrder.blueprint.projectId },
      select: { userId: true },
    });

    if (project && project.userId !== userId) {
      return {
        error: NextResponse.json(
          { error: 'Forbidden: You do not have permission to modify this work order' },
          { status: 403 }
        ),
      };
    }
  }

  // Work order without project association - auth is sufficient
  return { success: true };
}

/**
 * Check if a user owns a blueprint (via project chain, if exists).
 * Blueprints without a projectId are considered shared/system resources
 * and require authentication but not ownership.
 */
export async function requireBlueprintOwnership(
  blueprintId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const blueprint = await prisma.blueprint.findUnique({
    where: { id: blueprintId },
    select: { projectId: true },
  });

  if (!blueprint) {
    return {
      error: NextResponse.json({ error: 'Blueprint not found' }, { status: 404 }),
    };
  }

  // If blueprint has a project, check ownership
  if (blueprint.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: blueprint.projectId },
      select: { userId: true },
    });

    if (project && project.userId !== userId) {
      return {
        error: NextResponse.json(
          { error: 'Forbidden: You do not have permission to modify this blueprint' },
          { status: 403 }
        ),
      };
    }
  }

  // Blueprint without project association - auth is sufficient
  return { success: true };
}

/**
 * AFC-C2-STREAM-0: Check if a user owns a C2 session.
 * Enforces strict ownership - every session must have an owner.
 */
export async function requireC2SessionOwnership(
  sessionId: string,
  userId: string
): Promise<{ success: true; error?: never } | { success?: never; error: NextResponse }> {
  const devAuthBypass = isDevAuthBypass();

  // In dev bypass mode, skip ownership check
  if (devAuthBypass && userId === 'dev-bypass-user') {
    return { success: true };
  }

  const session = await prisma.c2Session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    return {
      error: NextResponse.json({ error: 'C2 session not found' }, { status: 404 }),
    };
  }

  // Strict ownership check - session must have owner and must match
  if (!session.userId || session.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this C2 session' },
        { status: 403 }
      ),
    };
  }

  return { success: true };
}
