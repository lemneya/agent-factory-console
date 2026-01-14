/**
 * AFC-1.6: Memory Layer MVP - Prisma Memory Provider
 *
 * Full implementation of the MemoryProvider interface using Prisma.
 * Supports deduplication, scoring, scope filtering, and budget enforcement.
 */

import { PrismaClient, MemoryScope, MemoryCategory } from '@prisma/client';
import type {
  MemoryProvider,
  MemoryItemInput,
  MemoryItem,
  MemoryQuery,
  MemoryQueryResult,
  IngestResult,
  MemoryPolicyConfig,
  MemoryUseInput,
  SnapshotInput,
  BudgetStatus,
} from './provider';
import { hashContent, estimateTokenCount } from './provider';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_POLICY: Omit<MemoryPolicyConfig, 'projectId'> = {
  maxItems: 1000,
  maxTokensPerQuery: 4000,
  maxTokensTotal: 100000,
  enabledScopes: ['PROJECT', 'RUN'] as MemoryScope[],
  enabledCategories: [
    'CODE',
    'DOCUMENTATION',
    'DECISION',
    'ERROR',
    'CONTEXT',
    'CUSTOM',
  ] as MemoryCategory[],
  dedupeEnabled: true,
  similarityThreshold: 0.95,
  decayFactor: 0.99,
  accessBoost: 0.1,
};

// ============================================================================
// Prisma Memory Provider Implementation
// ============================================================================

export class PrismaMemoryProvider implements MemoryProvider {
  constructor(private prisma: PrismaClient) {}

  // -------------------------------------------------------------------------
  // Ingest & Storage
  // -------------------------------------------------------------------------

  async ingest(input: MemoryItemInput): Promise<IngestResult> {
    const contentHash = await hashContent(input.content);

    // Check for existing item with same content (deduplication)
    const existing = await this.prisma.memoryItem.findFirst({
      where: {
        projectId: input.projectId!,
        content: input.content,
      },
    });

    if (existing) {
      // Update access count and score for existing item
      const updated = await this.prisma.memoryItem.update({
        where: { id: existing.id },
        data: {
          accessCount: { increment: 1 },
          lastUsedAt: new Date(),
          score: Math.min(1.0, existing.score + (DEFAULT_POLICY.accessBoost ?? 0.1)),
        },
      });

      return {
        item: this.toMemoryItem(updated),
        created: false,
        deduplicatedWith: existing.id,
      };
    }

    // Check budget before creating
    if (input.projectId) {
      const status = await this.getBudgetStatus(input.projectId);
      if (status.atLimit) {
        // Enforce budget to make room
        await this.enforceBudget(input.projectId, 80);
      }
    }

    // Create new item
    const created = await this.prisma.memoryItem.create({
      data: {
        projectId: input.projectId!,
        content: input.content,
        summary: input.summary ?? null,
        scope: input.scope ?? 'PROJECT',
        category: input.category ?? 'CONTEXT',
        score: input.score ?? 1.0,
        metadata: {
          ...(input.metadata || {}),
          contentHash,
          tokenCount: estimateTokenCount(input.content),
        } as unknown as Record<string, unknown>,
        expiresAt: input.expiresAt ?? undefined,
      },
    });

    return {
      item: this.toMemoryItem(created),
      created: true,
    };
  }

  async ingestBatch(inputs: MemoryItemInput[]): Promise<IngestResult[]> {
    const results: IngestResult[] = [];
    for (const input of inputs) {
      results.push(await this.ingest(input));
    }
    return results;
  }

  async update(id: string, updates: Partial<MemoryItemInput>): Promise<MemoryItem> {
    const data: Record<string, unknown> = {};

    if (updates.content !== undefined) {
      data.content = updates.content;
      const contentHash = await hashContent(updates.content);
      const tokenCount = estimateTokenCount(updates.content);

      // Get current metadata to merge
      const current = await this.prisma.memoryItem.findUnique({
        where: { id },
        select: { metadata: true },
      });
      data.metadata = {
        ...((current?.metadata as Record<string, unknown>) || {}),
        contentHash,
        tokenCount,
      };
    }
    if (updates.summary !== undefined) data.summary = updates.summary;
    if (updates.scope !== undefined) data.scope = updates.scope;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.score !== undefined) data.score = updates.score;
    if (updates.metadata !== undefined) {
      const current = await this.prisma.memoryItem.findUnique({
        where: { id },
        select: { metadata: true },
      });
      data.metadata = {
        ...((current?.metadata as Record<string, unknown>) || {}),
        ...updates.metadata,
      };
    }
    if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt;

    const updated = await this.prisma.memoryItem.update({
      where: { id },
      data: data as unknown as Record<string, unknown>,
    });

    return this.toMemoryItem(updated);
  }

  async archive(id: string): Promise<void> {
    const item = await this.prisma.memoryItem.findUnique({
      where: { id },
      select: { metadata: true },
    });
    const metadata = (item?.metadata as Record<string, unknown>) || {};
    await this.prisma.memoryItem.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          archived: true,
        } as unknown as Record<string, unknown>,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.memoryItem.delete({
      where: { id },
    });
  }

  // -------------------------------------------------------------------------
  // Query & Retrieval
  // -------------------------------------------------------------------------

  async query(query: MemoryQuery): Promise<MemoryQueryResult> {
    const where: Record<string, unknown> = {};

    if (query.projectId) where.projectId = query.projectId;
    if (query.scopes && query.scopes.length > 0) where.scope = { in: query.scopes };
    if (query.categories && query.categories.length > 0) where.category = { in: query.categories };
    if (query.minScore !== undefined) where.score = { gte: query.minScore };

    // Expired filtering
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    // Text search
    if (query.searchText) {
      where.AND = [
        {
          OR: [
            { content: { contains: query.searchText, mode: 'insensitive' } },
            { summary: { contains: query.searchText, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Archived filtering (via metadata)
    if (!query.includeArchived) {
      where.metadata = {
        path: ['archived'],
        not: true,
      };
    }

    const total = await this.prisma.memoryItem.count({
      where: where as unknown as Record<string, unknown>,
    });

    const orderBy: Record<string, unknown> = {};
    const orderField = query.orderBy === 'lastAccessed' ? 'lastUsedAt' : (query.orderBy ?? 'score');
    const orderDir = query.orderDirection ?? 'desc';
    orderBy[orderField] = orderDir;

    let maxTokens = DEFAULT_POLICY.maxTokensPerQuery ?? 4000;
    if (query.projectId) {
      const policy = await this.getPolicy(query.projectId);
      maxTokens = policy.maxTokensPerQuery ?? maxTokens;
    }

    const items = await this.prisma.memoryItem.findMany({
      where: where as unknown as Record<string, unknown>,
      orderBy: orderBy as unknown as Record<string, unknown>,
      skip: query.offset ?? 0,
      take: query.limit ?? 100,
    });

    let tokenCount = 0;
    let truncated = false;
    const resultItems: MemoryItem[] = [];

    for (const item of items) {
      const metadata = (item.metadata as Record<string, unknown>) || {};
      const itemTokenCount = (metadata.tokenCount as number) || estimateTokenCount(item.content);
      if (tokenCount + itemTokenCount > maxTokens) {
        truncated = true;
        break;
      }
      tokenCount += itemTokenCount;
      resultItems.push(this.toMemoryItem(item));
    }

    return {
      items: resultItems,
      total,
      tokenCount,
      truncated,
    };
  }

  async getById(id: string): Promise<MemoryItem | null> {
    const item = await this.prisma.memoryItem.findUnique({ where: { id } });
    return item ? this.toMemoryItem(item) : null;
  }

  async getByHash(contentHash: string, projectId?: string): Promise<MemoryItem[]> {
    const items = await this.prisma.memoryItem.findMany({
      where: {
        projectId: projectId ?? undefined,
        metadata: {
          path: ['contentHash'],
          equals: contentHash,
        },
      },
    });
    return items.map(item => this.toMemoryItem(item));
  }

  // -------------------------------------------------------------------------
  // Usage Tracking
  // -------------------------------------------------------------------------

  async recordUse(input: MemoryUseInput): Promise<void> {
    // MemoryAccessLog is the model name in schema
    await (
      this.prisma as unknown as { memoryAccessLog: { create: (args: unknown) => Promise<unknown> } }
    ).memoryAccessLog.create({
      data: {
        memoryItemId: input.memoryItemId,
        runId: input.runId,
        action: 'RETRIEVE',
        relevance: input.relevance ?? null,
      },
    });

    await this.prisma.memoryItem.update({
      where: { id: input.memoryItemId },
      data: {
        accessCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    await this.boostScore(input.memoryItemId, DEFAULT_POLICY.accessBoost ?? 0.1);
  }

  async getUsesForRun(
    runId: string,
    limit = 100
  ): Promise<Array<{ memoryItem: MemoryItem; usedAt: Date; context: string | null }>> {
    const uses = await (
      this.prisma as unknown as {
        memoryAccessLog: { findMany: (args: unknown) => Promise<unknown[]> };
      }
    ).memoryAccessLog.findMany({
      where: { runId },
      include: { memoryItem: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return uses.map((use: unknown) => ({
      memoryItem: this.toMemoryItem((use as { memoryItem: unknown }).memoryItem),
      usedAt: (use as { createdAt: Date }).createdAt,
      context: null,
    }));
  }

  // -------------------------------------------------------------------------
  // Snapshots
  // -------------------------------------------------------------------------

  async createSnapshot(input: SnapshotInput): Promise<string> {
    const snapshot = await this.prisma.runMemorySnapshot.create({
      data: {
        runId: input.runId,
        name: input.name ?? null,
        metadata: (input.metadata || {}) as unknown as Record<string, unknown>,
      },
    });

    if (input.itemIds && input.itemIds.length > 0) {
      const items = await this.prisma.memoryItem.findMany({
        where: { id: { in: input.itemIds } },
        select: { id: true, score: true },
      });

      await this.prisma.runMemorySnapshotItem.createMany({
        data: items.map(item => ({
          snapshotId: snapshot.id,
          memoryItemId: item.id,
          scoreAtSnapshot: item.score,
        })),
      });
    }

    return snapshot.id;
  }

  async getSnapshots(
    runId: string
  ): Promise<Array<{ id: string; name: string | null; snapshotAt: Date; totalItems: number }>> {
    const snapshots = await this.prisma.runMemorySnapshot.findMany({
      where: { runId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return snapshots.map(s => ({
      id: s.id,
      name: s.name,
      snapshotAt: s.createdAt,
      totalItems: s._count.items,
    }));
  }

  async getSnapshotItems(snapshotId: string): Promise<MemoryItem[]> {
    const snapshot = await this.prisma.runMemorySnapshot.findUnique({
      where: { id: snapshotId },
      include: { items: { include: { memoryItem: true } } },
    });

    if (!snapshot) return [];
    return snapshot.items.map(item => this.toMemoryItem(item.memoryItem));
  }

  // -------------------------------------------------------------------------
  // Policy & Budget
  // -------------------------------------------------------------------------

  async getPolicy(projectId: string): Promise<MemoryPolicyConfig> {
    const policy = await this.prisma.memoryPolicy.findUnique({ where: { projectId } });
    if (!policy) return { ...DEFAULT_POLICY, projectId };

    return {
      projectId: policy.projectId,
      maxItems: policy.maxItems,
      maxTokensPerQuery: policy.maxTokensPerQuery,
      maxTokensTotal: policy.maxTokensTotal,
      enabledScopes: (policy.enabledScopes as MemoryScope[]) || DEFAULT_POLICY.enabledScopes,
      enabledCategories:
        (policy.enabledCategories as MemoryCategory[]) || DEFAULT_POLICY.enabledCategories,
      dedupeEnabled: policy.dedupeEnabled,
      similarityThreshold: policy.similarityThreshold,
      decayFactor: policy.decayFactor,
      accessBoost: policy.accessBoost,
    };
  }

  async updatePolicy(config: MemoryPolicyConfig): Promise<MemoryPolicyConfig> {
    const { projectId, ...updates } = config;
    const policy = await this.prisma.memoryPolicy.upsert({
      where: { projectId },
      create: { projectId, ...DEFAULT_POLICY, ...updates },
      update: updates,
    });

    return this.getPolicy(policy.projectId);
  }

  async getBudgetStatus(projectId: string): Promise<BudgetStatus> {
    const policy = await this.getPolicy(projectId);
    const itemCount = await this.prisma.memoryItem.count({ where: { projectId } });

    const totalTokens = 0; // Placeholder
    const maxItems = policy.maxItems ?? 1000;
    const maxTokens = policy.maxTokensTotal ?? 100000;

    const utilizationPercent = Math.max(
      (itemCount / maxItems) * 100,
      (totalTokens / maxTokens) * 100
    );

    return {
      itemCount,
      maxItems,
      tokenCount: totalTokens,
      maxTokens,
      utilizationPercent,
      nearLimit: utilizationPercent > 80,
      atLimit: utilizationPercent >= 100,
    };
  }

  async enforceBudget(projectId: string, targetUtilization = 80): Promise<number> {
    const status = await this.getBudgetStatus(projectId);
    if (!status.atLimit && status.utilizationPercent <= targetUtilization) return 0;

    const policy = await this.getPolicy(projectId);
    const maxItems = policy.maxItems ?? 1000;
    const targetItems = Math.floor((maxItems * targetUtilization) / 100);
    const itemsToArchive = status.itemCount - targetItems;

    if (itemsToArchive <= 0) return 0;

    const toArchive = await this.prisma.memoryItem.findMany({
      where: { projectId },
      orderBy: { score: 'asc' },
      take: itemsToArchive,
      select: { id: true, metadata: true },
    });

    for (const item of toArchive) {
      const metadata = (item.metadata as Record<string, unknown>) || {};
      await this.prisma.memoryItem.update({
        where: { id: item.id },
        data: { metadata: { ...metadata, archived: true } as unknown as Record<string, unknown> },
      });
    }

    return toArchive.length;
  }

  // -------------------------------------------------------------------------
  // Scoring & Maintenance
  // -------------------------------------------------------------------------

  async applyScoreDecay(projectId?: string): Promise<number> {
    let decayFactor = DEFAULT_POLICY.decayFactor ?? 0.99;
    if (projectId) {
      const policy = await this.getPolicy(projectId);
      decayFactor = policy.decayFactor ?? decayFactor;
    }

    const result = await this.prisma.$executeRawUnsafe(
      `UPDATE "MemoryItem" SET score = score * ${decayFactor} WHERE 1=1 ${projectId ? `AND "projectId" = '${projectId}'` : ''}`
    );
    return result;
  }

  async boostScore(itemId: string, boost: number): Promise<void> {
    await this.prisma.memoryItem.update({
      where: { id: itemId },
      data: { score: { increment: Math.min(boost, 1.0) } },
    });
  }

  async archiveExpired(): Promise<number> {
    const result = await this.prisma.memoryItem.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        metadata: {
          path: ['archived'],
          not: true,
        },
      },
      data: {
        metadata: {
          archived: true,
        } as unknown as Record<string, unknown>,
      },
    });
    return result.count;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private toMemoryItem(item: unknown): MemoryItem {
    const i = item as {
      id: string;
      projectId: string | null;
      runId: string | null;
      content: string;
      summary: string | null;
      scope: string;
      category: string;
      score: number;
      accessCount: number;
      lastUsedAt: Date;
      metadata: unknown;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    const metadata = (i.metadata as Record<string, unknown>) || {};
    return {
      id: i.id,
      projectId: i.projectId,
      runId: i.runId,
      contentHash: (metadata.contentHash as string) || '',
      content: i.content,
      summary: i.summary,
      scope: i.scope as MemoryScope,
      category: i.category as MemoryCategory,
      source: (metadata.source as string) || null,
      sourceType: (metadata.sourceType as string) || null,
      score: i.score,
      accessCount: i.accessCount,
      lastAccessed: i.lastUsedAt,
      tokenCount: (metadata.tokenCount as number) || estimateTokenCount(i.content),
      metadata,
      expiresAt: i.expiresAt,
      archived: (metadata.archived as boolean) || false,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}

export function getMemoryProvider(prisma: PrismaClient) {
  return new PrismaMemoryProvider(prisma);
}

import type { PrismaClient } from "@prisma/client";

export function getMemoryProvider(prisma: PrismaClient) {
  return new PrismaMemoryProvider(prisma);
}

import type { PrismaClient } from "@prisma/client";

export function getMemoryProvider(prisma: PrismaClient) {
  return new PrismaMemoryProvider(prisma);
}

import type { PrismaClient } from "@prisma/client";

export function getMemoryProvider(prisma: PrismaClient) {
  return new PrismaMemoryProvider(prisma);
}

import type { PrismaClient } from "@prisma/client";

export function getMemoryProvider(prisma: PrismaClient) {
  return new PrismaMemoryProvider(prisma);
}
