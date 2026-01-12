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
    const tokenCount = estimateTokenCount(input.content);

    // Check for existing item with same hash (deduplication)
    const existing = await this.prisma.memoryItem.findFirst({
      where: {
        contentHash,
        projectId: input.projectId ?? null,
        archived: false,
      },
    });

    if (existing) {
      // Update access count and score for existing item
      const updated = await this.prisma.memoryItem.update({
        where: { id: existing.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
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
        projectId: input.projectId ?? null,
        runId: input.runId ?? null,
        contentHash,
        content: input.content,
        summary: input.summary ?? null,
        scope: input.scope ?? 'PROJECT',
        category: input.category ?? 'CONTEXT',
        source: input.source ?? null,
        sourceType: input.sourceType ?? null,
        score: input.score ?? 1.0,
        tokenCount,
        metadata: input.metadata as object | undefined,
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
      data.contentHash = await hashContent(updates.content);
      data.tokenCount = estimateTokenCount(updates.content);
    }
    if (updates.summary !== undefined) data.summary = updates.summary;
    if (updates.scope !== undefined) data.scope = updates.scope;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.source !== undefined) data.source = updates.source;
    if (updates.sourceType !== undefined) data.sourceType = updates.sourceType;
    if (updates.score !== undefined) data.score = updates.score;
    if (updates.metadata !== undefined) data.metadata = updates.metadata;
    if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt;

    const updated = await this.prisma.memoryItem.update({
      where: { id },
      data,
    });

    return this.toMemoryItem(updated);
  }

  async archive(id: string): Promise<void> {
    await this.prisma.memoryItem.update({
      where: { id },
      data: { archived: true },
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

    // Project scope
    if (query.projectId) {
      where.projectId = query.projectId;
    }

    // Run scope
    if (query.runId) {
      where.runId = query.runId;
    }

    // Scope filtering
    if (query.scopes && query.scopes.length > 0) {
      where.scope = { in: query.scopes };
    }

    // Category filtering
    if (query.categories && query.categories.length > 0) {
      where.category = { in: query.categories };
    }

    // Score filtering
    if (query.minScore !== undefined) {
      where.score = { gte: query.minScore };
    }

    // Archived filtering
    if (!query.includeArchived) {
      where.archived = false;
    }

    // Expired filtering - items must not be expired
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    // Text search (simple contains) - wrap with AND to combine with expired filter
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

    // Get total count
    const total = await this.prisma.memoryItem.count({ where });

    // Determine ordering
    const orderBy: Record<string, string> = {};
    const orderField = query.orderBy ?? 'score';
    const orderDir = query.orderDirection ?? 'desc';
    orderBy[orderField] = orderDir;

    // Get policy for budget enforcement
    let maxTokens = DEFAULT_POLICY.maxTokensPerQuery ?? 4000;
    if (query.projectId) {
      const policy = await this.getPolicy(query.projectId);
      maxTokens = policy.maxTokensPerQuery ?? maxTokens;
    }

    // Fetch items
    const items = await this.prisma.memoryItem.findMany({
      where,
      orderBy,
      skip: query.offset ?? 0,
      take: query.limit ?? 100,
    });

    // Apply token budget
    let tokenCount = 0;
    let truncated = false;
    const resultItems: MemoryItem[] = [];

    for (const item of items) {
      if (tokenCount + item.tokenCount > maxTokens) {
        truncated = true;
        break;
      }
      tokenCount += item.tokenCount;
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
    const item = await this.prisma.memoryItem.findUnique({
      where: { id },
    });

    return item ? this.toMemoryItem(item) : null;
  }

  async getByHash(contentHash: string, projectId?: string): Promise<MemoryItem[]> {
    const items = await this.prisma.memoryItem.findMany({
      where: {
        contentHash,
        ...(projectId && { projectId }),
        archived: false,
      },
    });

    return items.map(item => this.toMemoryItem(item));
  }

  // -------------------------------------------------------------------------
  // Usage Tracking
  // -------------------------------------------------------------------------

  async recordUse(input: MemoryUseInput): Promise<void> {
    // Create usage record
    await this.prisma.memoryUse.create({
      data: {
        memoryItemId: input.memoryItemId,
        runId: input.runId,
        context: input.context ?? null,
        queryText: input.queryText ?? null,
        relevance: input.relevance ?? null,
      },
    });

    // Update access count and last accessed
    await this.prisma.memoryItem.update({
      where: { id: input.memoryItemId },
      data: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
      },
    });

    // Apply access boost
    await this.boostScore(input.memoryItemId, DEFAULT_POLICY.accessBoost ?? 0.1);
  }

  async getUsesForRun(
    runId: string,
    limit = 100
  ): Promise<Array<{ memoryItem: MemoryItem; usedAt: Date; context: string | null }>> {
    const uses = await this.prisma.memoryUse.findMany({
      where: { runId },
      include: { memoryItem: true },
      orderBy: { usedAt: 'desc' },
      take: limit,
    });

    return uses.map(use => ({
      memoryItem: this.toMemoryItem(use.memoryItem),
      usedAt: use.usedAt,
      context: use.context,
    }));
  }

  // -------------------------------------------------------------------------
  // Snapshots
  // -------------------------------------------------------------------------

  async createSnapshot(input: SnapshotInput): Promise<string> {
    // Get items to include in snapshot
    const items = await this.prisma.memoryItem.findMany({
      where: { id: { in: input.itemIds } },
    });

    const totalTokens = items.reduce((sum, item) => sum + item.tokenCount, 0);

    // Create snapshot
    const snapshot = await this.prisma.runMemorySnapshot.create({
      data: {
        runId: input.runId,
        name: input.name ?? null,
        description: input.description ?? null,
        totalItems: items.length,
        totalTokens,
        metadata: input.metadata as object | undefined,
        items: {
          create: items.map(item => ({
            memoryItemId: item.id,
            scoreAtSnapshot: item.score,
          })),
        },
      },
    });

    return snapshot.id;
  }

  async getSnapshots(
    runId: string
  ): Promise<Array<{ id: string; name: string | null; snapshotAt: Date; totalItems: number }>> {
    const snapshots = await this.prisma.runMemorySnapshot.findMany({
      where: { runId },
      orderBy: { snapshotAt: 'desc' },
    });

    return snapshots.map(s => ({
      id: s.id,
      name: s.name,
      snapshotAt: s.snapshotAt,
      totalItems: s.totalItems,
    }));
  }

  async getSnapshotItems(snapshotId: string): Promise<MemoryItem[]> {
    const snapshot = await this.prisma.runMemorySnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        items: {
          include: { memoryItem: true },
        },
      },
    });

    if (!snapshot) return [];

    return snapshot.items.map(si => this.toMemoryItem(si.memoryItem));
  }

  // -------------------------------------------------------------------------
  // Policy & Budget
  // -------------------------------------------------------------------------

  async getPolicy(projectId: string): Promise<MemoryPolicyConfig> {
    const policy = await this.prisma.memoryPolicy.findUnique({
      where: { projectId },
    });

    if (!policy) {
      return { projectId, ...DEFAULT_POLICY };
    }

    return {
      projectId: policy.projectId,
      maxItems: policy.maxItems,
      maxTokensPerQuery: policy.maxTokensPerQuery,
      maxTokensTotal: policy.maxTokensTotal,
      enabledScopes: JSON.parse(policy.enabledScopes as string) as MemoryScope[],
      enabledCategories: JSON.parse(policy.enabledCategories as string) as MemoryCategory[],
      defaultTtlDays: policy.defaultTtlDays,
      autoArchiveDays: policy.autoArchiveDays,
      dedupeEnabled: policy.dedupeEnabled,
      similarityThreshold: policy.similarityThreshold,
      decayFactor: policy.decayFactor,
      accessBoost: policy.accessBoost,
    };
  }

  async updatePolicy(config: MemoryPolicyConfig): Promise<MemoryPolicyConfig> {
    const data: Record<string, unknown> = {};

    if (config.maxItems !== undefined) data.maxItems = config.maxItems;
    if (config.maxTokensPerQuery !== undefined) data.maxTokensPerQuery = config.maxTokensPerQuery;
    if (config.maxTokensTotal !== undefined) data.maxTokensTotal = config.maxTokensTotal;
    if (config.enabledScopes !== undefined)
      data.enabledScopes = JSON.stringify(config.enabledScopes);
    if (config.enabledCategories !== undefined)
      data.enabledCategories = JSON.stringify(config.enabledCategories);
    if (config.defaultTtlDays !== undefined) data.defaultTtlDays = config.defaultTtlDays;
    if (config.autoArchiveDays !== undefined) data.autoArchiveDays = config.autoArchiveDays;
    if (config.dedupeEnabled !== undefined) data.dedupeEnabled = config.dedupeEnabled;
    if (config.similarityThreshold !== undefined)
      data.similarityThreshold = config.similarityThreshold;
    if (config.decayFactor !== undefined) data.decayFactor = config.decayFactor;
    if (config.accessBoost !== undefined) data.accessBoost = config.accessBoost;

    const policy = await this.prisma.memoryPolicy.upsert({
      where: { projectId: config.projectId },
      create: {
        projectId: config.projectId,
        ...data,
      },
      update: data,
    });

    return this.getPolicy(policy.projectId);
  }

  async getBudgetStatus(projectId: string): Promise<BudgetStatus> {
    const policy = await this.getPolicy(projectId);

    const [itemCount, tokenAgg] = await Promise.all([
      this.prisma.memoryItem.count({
        where: { projectId, archived: false },
      }),
      this.prisma.memoryItem.aggregate({
        where: { projectId, archived: false },
        _sum: { tokenCount: true },
      }),
    ]);

    const tokenCount = tokenAgg._sum.tokenCount ?? 0;
    const maxItems = policy.maxItems ?? DEFAULT_POLICY.maxItems ?? 1000;
    const maxTokens = policy.maxTokensTotal ?? DEFAULT_POLICY.maxTokensTotal ?? 100000;

    const itemUtilization = (itemCount / maxItems) * 100;
    const tokenUtilization = (tokenCount / maxTokens) * 100;
    const utilizationPercent = Math.max(itemUtilization, tokenUtilization);

    return {
      itemCount,
      maxItems,
      tokenCount,
      maxTokens,
      utilizationPercent,
      nearLimit: utilizationPercent > 80,
      atLimit: utilizationPercent >= 100,
    };
  }

  async enforceBudget(projectId: string, targetUtilization = 80): Promise<number> {
    const status = await this.getBudgetStatus(projectId);

    if (status.utilizationPercent <= targetUtilization) {
      return 0;
    }

    // Calculate how many items to archive
    const targetItems = Math.floor((status.maxItems * targetUtilization) / 100);
    const itemsToArchive = status.itemCount - targetItems;

    if (itemsToArchive <= 0) return 0;

    // Get lowest-scoring items to archive
    const toArchive = await this.prisma.memoryItem.findMany({
      where: { projectId, archived: false },
      orderBy: { score: 'asc' },
      take: itemsToArchive,
      select: { id: true },
    });

    // Archive items
    await this.prisma.memoryItem.updateMany({
      where: { id: { in: toArchive.map(i => i.id) } },
      data: { archived: true },
    });

    return toArchive.length;
  }

  // -------------------------------------------------------------------------
  // Scoring & Maintenance
  // -------------------------------------------------------------------------

  async applyScoreDecay(projectId?: string): Promise<number> {
    const where: Record<string, unknown> = { archived: false };
    if (projectId) where.projectId = projectId;

    // Get decay factor from policy or use default
    let decayFactor = DEFAULT_POLICY.decayFactor ?? 0.99;
    if (projectId) {
      const policy = await this.getPolicy(projectId);
      decayFactor = policy.decayFactor ?? decayFactor;
    }

    // Update all items with decay
    const result = await this.prisma.$executeRaw`
      UPDATE "MemoryItem"
      SET score = score * ${decayFactor}
      WHERE archived = false
      ${projectId ? `AND "projectId" = '${projectId}'` : ''}
    `;

    return result;
  }

  async boostScore(itemId: string, boost: number): Promise<void> {
    await this.prisma.memoryItem.update({
      where: { id: itemId },
      data: {
        score: { increment: Math.min(boost, 1.0) },
      },
    });

    // Ensure score doesn't exceed 1.0
    await this.prisma.memoryItem.updateMany({
      where: { id: itemId, score: { gt: 1.0 } },
      data: { score: 1.0 },
    });
  }

  async archiveExpired(): Promise<number> {
    const result = await this.prisma.memoryItem.updateMany({
      where: {
        archived: false,
        expiresAt: { lte: new Date() },
      },
      data: { archived: true },
    });

    return result.count;
  }

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------

  private toMemoryItem(item: {
    id: string;
    projectId: string | null;
    runId: string | null;
    contentHash: string;
    content: string;
    summary: string | null;
    scope: MemoryScope;
    category: MemoryCategory;
    source: string | null;
    sourceType: string | null;
    score: number;
    accessCount: number;
    lastAccessed: Date | null;
    tokenCount: number;
    metadata: unknown;
    expiresAt: Date | null;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): MemoryItem {
    return {
      id: item.id,
      projectId: item.projectId,
      runId: item.runId,
      contentHash: item.contentHash,
      content: item.content,
      summary: item.summary,
      scope: item.scope,
      category: item.category,
      source: item.source,
      sourceType: item.sourceType,
      score: item.score,
      accessCount: item.accessCount,
      lastAccessed: item.lastAccessed,
      tokenCount: item.tokenCount,
      metadata: item.metadata as Record<string, unknown> | null,
      expiresAt: item.expiresAt,
      archived: item.archived,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

let memoryProviderInstance: PrismaMemoryProvider | null = null;

/**
 * Get or create a singleton PrismaMemoryProvider instance
 */
export function getMemoryProvider(prisma: PrismaClient): PrismaMemoryProvider {
  if (!memoryProviderInstance) {
    memoryProviderInstance = new PrismaMemoryProvider(prisma);
  }
  return memoryProviderInstance;
}
