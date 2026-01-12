/**
 * AFC-1.6: Memory Layer MVP - Query API
 *
 * POST /api/memory/query
 * Query memory items with filtering, scoring, and budget enforcement.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMemoryProvider } from '@/memory/prismaProvider';
import type { MemoryQuery } from '@/memory/provider';
import { MemoryScope, MemoryCategory } from '@prisma/client';

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
      items: result.items.map(item => ({
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
  } catch (error) {
    console.error('Error querying memory:', error);
    return NextResponse.json(
      { error: 'Failed to query memory' },
      { status: 500 }
    );
  }
}
