/**
 * AFC-QUOTE-0: Baseline Estimation API
 *
 * POST /api/quotes/estimate - Generate a build-from-scratch estimate
 *
 * Security: Requires authentication
 * Validation: Strict schema, no extra fields allowed
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth-helpers';
import {
  validateScope,
  generateEstimate,
  formatEstimateEvidence,
} from '@/lib/quote-engine';

/**
 * POST /api/quotes/estimate
 * Generate and persist a baseline estimate
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate scope (strict, no extra fields)
  const validation = validateScope(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { scope } = validation;

  // Extract optional sessionId
  const sessionId = (body as Record<string, unknown>).sessionId as string | undefined;

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

  try {
    // Generate estimate using deterministic engine
    const estimate = generateEstimate(scope);

    // Persist estimate to database
    const savedEstimate = await prisma.estimate.create({
      data: {
        userId,
        sessionId: sessionId || null,
        scopeJson: scope as unknown as Prisma.InputJsonValue,
        effortHours: estimate.effortHours,
        minCost: estimate.minCost,
        maxCost: estimate.maxCost,
        currency: estimate.currency,
        assumptions: estimate.assumptions as Prisma.InputJsonValue,
        risks: estimate.risks as Prisma.InputJsonValue,
      },
    });

    // Log C2 event if sessionId provided
    if (sessionId) {
      await prisma.c2Event.create({
        data: {
          sessionId,
          agentIndex: 0,
          type: 'ARTIFACT_CREATED',
          payload: {
            action: 'QUOTE_GENERATED',
            estimateId: savedEstimate.id,
            effortHours: estimate.effortHours,
            minCost: estimate.minCost,
            maxCost: estimate.maxCost,
          } as Prisma.InputJsonValue,
        },
      });
    }

    // Build response with evidence trail
    const evidence = formatEstimateEvidence(estimate, scope);

    return NextResponse.json({
      id: savedEstimate.id,
      estimate: {
        effortHours: estimate.effortHours,
        minCost: estimate.minCost,
        maxCost: estimate.maxCost,
        currency: estimate.currency,
        assumptions: estimate.assumptions,
        risks: estimate.risks,
        breakdown: estimate.breakdown,
      },
      evidence,
      createdAt: savedEstimate.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('[Quotes] POST /estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate estimate' },
      { status: 500 }
    );
  }
}
