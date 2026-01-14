/**
 * AFC-1.6: Memory Layer MVP - Query API
 *
 * POST /api/memory/query
 * Query memory items with filtering, scoring, and budget enforcement.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MemoryItem, MemoryQuery } from '@/memory/provider';
import type { MemoryScope, MemoryCategory } from '@prisma/client';

interface QueryRequestBody {
  projectId?: string;
  runId?: string;
  scopes?: MemoryScope[];
  categories?: MemoryCategory[];
  searchText?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  orderBy?: 'score' | 'createdAt' | 'accessCount' | 'lastAccessed';
  orderDirection?: 'asc' | 'desc';
  recordUse?: boolean; // If true, records usage for each returned item
}

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequestBody = await request.json();

    // Dynamic imports to avoid import-time Prisma initialization errors
    const { default: prisma } = await import("@/lib/prisma");
    const { getMemoryProvider } = await import("@/memory/prismaProvider");
    const provider = getMemoryProvider(prisma);

    // Build query from request body
    const query: MemoryQuery = {
      projectId: body.projectId,
      runId: body.runId,
      scopes: body.scopes,
      categories: body.categories,
      searchText: body.searchText,
      minScore: body.minScore,
      limit: body.limit ?? 50,
      offset: body.offset ?? 0,
      includeArchived: body.includeArchived ?? false,
      orderBy: body.orderBy ?? 'score',
      orderDirection: body.orderDirection ?? 'desc',
    };

    // Execute query
    const result = await provider.query(query);

    // Optionally record usage for returned items
    if (body.recordUse && body.runId) {
      for (const item of result.items) {
        await provider.recordUse({
          memoryItemId: item.id,
          runId: body.runId,
          queryText: body.searchText,
          relevance: item.score,
        });
      }
    }

    return NextResponse.json({
      items: result.items.map((item: MemoryItem) => ({
        id: item.id,
        content: item.content,
        summary: item.summary,
        scope: item.scope,
        category: item.category,
        source: item.source,
        score: item.score,
        tokenCount: item.tokenCount,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
        createdAt: item.createdAt,
      })),
      total: result.total,
      tokenCount: result.tokenCount,
      truncated: result.truncated,
      query: {
        limit: query.limit,
        offset: query.offset,
      },
    });
  } catch (error: unknown) {
    console.error('Error querying memory:', error);

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
      { error: 'Failed to query memory', details: errorMessage },
      { status: 500 }
    );
  }
}
