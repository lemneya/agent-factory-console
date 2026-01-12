/**
 * AFC-1.6: Memory Layer MVP - Policy API
 *
 * GET /api/memory/policy?projectId=xxx
 * Get memory policy for a project.
 *
 * PUT /api/memory/policy
 * Update memory policy for a project.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMemoryProvider } from '@/memory/prismaProvider';
import type { MemoryPolicyConfig } from '@/memory/provider';
import { MemoryScope, MemoryCategory } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: projectId' },
        { status: 400 }
      );
    }

    const provider = getMemoryProvider(prisma);
    const policy = await provider.getPolicy(projectId);
    const budgetStatus = await provider.getBudgetStatus(projectId);

    return NextResponse.json({
      policy,
      budgetStatus,
    });
  } catch (error) {
    console.error('Error getting memory policy:', error);
    return NextResponse.json(
      { error: 'Failed to get memory policy' },
      { status: 500 }
    );
  }
}

interface PolicyUpdateBody {
  projectId: string;
  maxItems?: number;
  maxTokensPerQuery?: number;
  maxTokensTotal?: number;
  enabledScopes?: MemoryScope[];
  enabledCategories?: MemoryCategory[];
  defaultTtlDays?: number | null;
  autoArchiveDays?: number | null;
  dedupeEnabled?: boolean;
  similarityThreshold?: number;
  decayFactor?: number;
  accessBoost?: number;
}

export async function PUT(request: NextRequest) {
  try {
    const body: PolicyUpdateBody = await request.json();

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (body.maxItems !== undefined && body.maxItems < 1) {
      return NextResponse.json(
        { error: 'maxItems must be at least 1' },
        { status: 400 }
      );
    }
    if (body.maxTokensPerQuery !== undefined && body.maxTokensPerQuery < 100) {
      return NextResponse.json(
        { error: 'maxTokensPerQuery must be at least 100' },
        { status: 400 }
      );
    }
    if (body.decayFactor !== undefined && (body.decayFactor < 0 || body.decayFactor > 1)) {
      return NextResponse.json(
        { error: 'decayFactor must be between 0 and 1' },
        { status: 400 }
      );
    }
    if (body.accessBoost !== undefined && (body.accessBoost < 0 || body.accessBoost > 1)) {
      return NextResponse.json(
        { error: 'accessBoost must be between 0 and 1' },
        { status: 400 }
      );
    }

    const provider = getMemoryProvider(prisma);

    const config: MemoryPolicyConfig = {
      projectId: body.projectId,
      maxItems: body.maxItems,
      maxTokensPerQuery: body.maxTokensPerQuery,
      maxTokensTotal: body.maxTokensTotal,
      enabledScopes: body.enabledScopes,
      enabledCategories: body.enabledCategories,
      defaultTtlDays: body.defaultTtlDays,
      autoArchiveDays: body.autoArchiveDays,
      dedupeEnabled: body.dedupeEnabled,
      similarityThreshold: body.similarityThreshold,
      decayFactor: body.decayFactor,
      accessBoost: body.accessBoost,
    };

    const updatedPolicy = await provider.updatePolicy(config);
    const budgetStatus = await provider.getBudgetStatus(body.projectId);

    return NextResponse.json({
      success: true,
      policy: updatedPolicy,
      budgetStatus,
    });
  } catch (error) {
    console.error('Error updating memory policy:', error);
    return NextResponse.json(
      { error: 'Failed to update memory policy' },
      { status: 500 }
    );
  }
}
