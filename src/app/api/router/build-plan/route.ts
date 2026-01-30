/**
 * AFC-ROUTER-INVENTORY-OSS-0: Build Plan API
 *
 * POST /api/router/build-plan - Generate internal build routing plan
 *
 * INTERNAL USE ONLY - Does not affect client pricing.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth-helpers';
import { routeBuild, generateBuildSummary, type EstimateScope } from '@/lib/router';

// ============================================================================
// Request Validation (Strict Schema)
// ============================================================================

interface BuildPlanRequest {
  estimateId?: string;
  sessionId?: string;
  scope?: EstimateScope;
}

// Allowed fields (strict, no extras)
const ALLOWED_TOP_LEVEL = ['estimateId', 'sessionId', 'scope'];
const ALLOWED_SCOPE_FIELDS = ['appType', 'features', 'integrations', 'complexity', 'timeline'];

function validateRequest(
  body: unknown
): { valid: true; data: BuildPlanRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const obj = body as Record<string, unknown>;

  // Reject extra top-level fields
  const extraTopLevel = Object.keys(obj).filter(k => !ALLOWED_TOP_LEVEL.includes(k));
  if (extraTopLevel.length > 0) {
    return { valid: false, error: `Extra fields not allowed: ${extraTopLevel.join(', ')}` };
  }

  // Must have either estimateId or scope
  if (!obj.estimateId && !obj.scope) {
    return { valid: false, error: 'Either estimateId or scope is required' };
  }

  // Validate estimateId if provided
  if (obj.estimateId !== undefined && typeof obj.estimateId !== 'string') {
    return { valid: false, error: 'estimateId must be a string' };
  }

  // Validate sessionId if provided
  if (obj.sessionId !== undefined && typeof obj.sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string' };
  }

  // Validate scope if provided
  if (obj.scope) {
    if (typeof obj.scope !== 'object') {
      return { valid: false, error: 'scope must be an object' };
    }

    const scope = obj.scope as Record<string, unknown>;

    // Reject extra scope fields
    const extraScopeFields = Object.keys(scope).filter(k => !ALLOWED_SCOPE_FIELDS.includes(k));
    if (extraScopeFields.length > 0) {
      return {
        valid: false,
        error: `Extra fields in scope not allowed: ${extraScopeFields.join(', ')}`,
      };
    }

    // Validate appType
    if (typeof scope.appType !== 'string') {
      return { valid: false, error: 'scope.appType must be a string' };
    }
    if (!['web', 'mobile', 'backend'].includes(scope.appType)) {
      return { valid: false, error: 'scope.appType must be web, mobile, or backend' };
    }

    // Validate features array and element types
    if (!Array.isArray(scope.features)) {
      return { valid: false, error: 'scope.features must be an array' };
    }
    for (const f of scope.features) {
      if (typeof f !== 'string') {
        return { valid: false, error: 'scope.features must contain only strings' };
      }
    }

    // Validate integrations array and element types
    if (!Array.isArray(scope.integrations)) {
      return { valid: false, error: 'scope.integrations must be an array' };
    }
    for (const i of scope.integrations) {
      if (typeof i !== 'string') {
        return { valid: false, error: 'scope.integrations must contain only strings' };
      }
    }

    // Validate complexity
    if (typeof scope.complexity !== 'string') {
      return { valid: false, error: 'scope.complexity must be a string' };
    }
    if (!['low', 'medium', 'high'].includes(scope.complexity)) {
      return { valid: false, error: 'scope.complexity must be low, medium, or high' };
    }

    // Validate timeline
    if (typeof scope.timeline !== 'string') {
      return { valid: false, error: 'scope.timeline must be a string' };
    }
    if (!['normal', 'rush'].includes(scope.timeline)) {
      return { valid: false, error: 'scope.timeline must be normal or rush' };
    }
  }

  return {
    valid: true,
    data: {
      estimateId: obj.estimateId as string | undefined,
      sessionId: obj.sessionId as string | undefined,
      scope: obj.scope as EstimateScope | undefined,
    },
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { estimateId, sessionId, scope: directScope } = validation.data;

  try {
    let scope: EstimateScope;
    let resolvedEstimateId: string | null = null;

    // If estimateId provided, load from database
    if (estimateId) {
      const estimate = await prisma.estimate.findFirst({
        where: { id: estimateId, userId },
      });

      if (!estimate) {
        return NextResponse.json(
          { error: 'Estimate not found or not owned by user' },
          { status: 404 }
        );
      }

      scope = estimate.scopeJson as unknown as EstimateScope;
      resolvedEstimateId = estimate.id;
    } else if (directScope) {
      scope = directScope;
    } else {
      return NextResponse.json(
        { error: 'Either estimateId or scope is required' },
        { status: 400 }
      );
    }

    // Validate sessionId ownership if provided
    if (sessionId) {
      const session = await prisma.c2Session.findFirst({
        where: { id: sessionId, userId },
      });
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found or not owned by user' },
          { status: 403 }
        );
      }
    }

    // Run build routing
    const routeResult = await routeBuild(scope);
    const summary = generateBuildSummary(routeResult);

    // Persist BuildPlan
    const buildPlan = await prisma.buildPlan.create({
      data: {
        userId,
        sessionId: sessionId || null,
        estimateId: resolvedEstimateId,
        strategy: routeResult.strategy,
        coverage: routeResult.coverage,
        summary,
        details: JSON.parse(
          JSON.stringify({
            inventoryCoverage: routeResult.details.inventoryCoverage,
            ossCoverage: routeResult.details.ossCoverage,
            combinedCoverage: routeResult.details.combinedCoverage,
            uncoveredFeatures: routeResult.details.uncoveredFeatures,
            requiresKimi: routeResult.details.requiresKimi,
            estimatedReusePercentage: routeResult.details.estimatedReusePercentage,
            matchedAssets: routeResult.inventory.matchedAssets,
            ossCandidate: routeResult.oss.bestMatch,
            rejectedForLicense: routeResult.oss.rejectedForLicense,
            rationale: routeResult.rationale,
          })
        ),
      },
    });

    // Log C2 event if sessionId provided
    if (sessionId) {
      await prisma.c2Event.create({
        data: {
          sessionId,
          type: 'LOG',
          payload: {
            message: `Build plan generated: strategy=${routeResult.strategy} (coverage ${(routeResult.coverage * 100).toFixed(0)}%)`,
            buildPlanId: buildPlan.id,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json(
      {
        buildPlanId: buildPlan.id,
        strategy: routeResult.strategy,
        coverage: routeResult.coverage,
        summary,
        details: routeResult.details,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Router] POST /build-plan error:', error);
    return NextResponse.json({ error: 'Failed to generate build plan' }, { status: 500 });
  }
}
