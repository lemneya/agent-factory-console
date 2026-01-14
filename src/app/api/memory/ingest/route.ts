/**
 * AFC-1.6: Memory Layer MVP - Ingest API
 *
 * POST /api/memory/ingest
 * Ingest new memory items with automatic deduplication.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MemoryItemInput } from '@/memory/provider';
import type { MemoryScope, MemoryCategory } from '@prisma/client';

interface IngestRequestBody {
  items: Array<{
    content: string;
    summary?: string;
    projectId?: string;
    runId?: string;
    scope?: MemoryScope;
    category?: MemoryCategory;
    source?: string;
    sourceType?: 'file' | 'url' | 'manual' | 'agent';
    score?: number;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: IngestRequestBody = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: items (array of memory items)' },
        { status: 400 }
      );
    }

    // Validate each item has content
    for (let i = 0; i < body.items.length; i++) {
      if (!body.items[i].content) {
        return NextResponse.json(
          { error: `Item at index ${i} is missing required field: content` },
          { status: 400 }
        );
      }
    }

    // Dynamic imports to avoid import-time Prisma initialization errors
    const { default: prisma } = await import('@/lib/prisma');
    const { getMemoryProvider } = await import('@/memory/prismaProvider');

    const provider = getMemoryProvider(prisma);

    // Convert request items to MemoryItemInput
    const inputs: MemoryItemInput[] = body.items.map((item: IngestRequestBody['items'][number]) => ({
      content: item.content,
      summary: item.summary,
      projectId: item.projectId,
      runId: item.runId,
      scope: item.scope,
      category: item.category,
      source: item.source,
      sourceType: item.sourceType,
      score: item.score,
      metadata: item.metadata,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
    }));

    // Ingest all items
    const results = await provider.ingestBatch(inputs);

    // Calculate statistics
    const stats = {
      total: results.length,
      created: results.filter((r: IngestResult) => r.created).length,
      deduplicated: results.filter((r: IngestResult) => !r.created).length,
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        items: results.map((r: IngestResult) => ({
          id: r.item.id,
          created: r.created,
          deduplicatedWith: r.deduplicatedWith,
          contentHash: r.item.contentHash,
          tokenCount: r.item.tokenCount,
        })),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error ingesting memory items:', error);

    // Check for specific Prisma errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.constructor.name : '';

    // Database not available (missing DATABASE_URL, connection issues, or missing tables)
    if (
      errorName === 'PrismaClientInitializationError' ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('P2021') ||
      errorMessage.includes('P2025')
    ) {
      return NextResponse.json(
        { error: 'Memory layer not initialized. Database not available.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to ingest memory items', details: errorMessage },
      { status: 500 }
    );
  }
}
