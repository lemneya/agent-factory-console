/**
 * AFC-1.6: Memory Layer MVP - Provider Interface
 *
 * Defines the contract for memory storage and retrieval implementations.
 * Supports deduplication, scoring, scope filtering, and budget enforcement.
 */

import type { MemoryScope, MemoryCategory } from '@prisma/client';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a memory item that can be ingested into the system
 */
export interface MemoryItemInput {
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
  expiresAt?: Date;
}

/**
 * Represents a stored memory item
 */
export interface MemoryItem {
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
  metadata: Record<string, unknown> | null;
  expiresAt: Date | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for memory retrieval
 */
export interface MemoryQuery {
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
}

/**
 * Result of a memory query
 */
export interface MemoryQueryResult {
  items: MemoryItem[];
  total: number;
  tokenCount: number;
  truncated: boolean;
}

/**
 * Result of ingesting a memory item
 */
export interface IngestResult {
  item: MemoryItem;
  created: boolean; // false if deduplicated
  deduplicatedWith?: string; // ID of existing item if deduplicated
}

/**
 * Memory policy configuration
 */
export interface MemoryPolicyConfig {
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

/**
 * Memory usage tracking for a run
 */
export interface MemoryUseInput {
  memoryItemId: string;
  runId: string;
  context?: string;
  queryText?: string;
  relevance?: number;
}

/**
 * Memory snapshot creation input
 */
export interface SnapshotInput {
  runId: string;
  name?: string;
  description?: string;
  itemIds: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Budget status for a project
 */
export interface BudgetStatus {
  itemCount: number;
  maxItems: number;
  tokenCount: number;
  maxTokens: number;
  utilizationPercent: number;
  nearLimit: boolean; // true if > 80% utilized
  atLimit: boolean;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Memory Provider Interface
 *
 * Implementations must provide all methods for a complete memory layer.
 */
export interface MemoryProvider {
  // -------------------------------------------------------------------------
  // Ingest & Storage
  // -------------------------------------------------------------------------

  /**
   * Ingest a new memory item with deduplication
   * @param input - The memory item to ingest
   * @returns The ingested or deduplicated item
   */
  ingest(input: MemoryItemInput): Promise<IngestResult>;

  /**
   * Ingest multiple memory items
   * @param inputs - Array of memory items to ingest
   * @returns Array of ingest results
   */
  ingestBatch(inputs: MemoryItemInput[]): Promise<IngestResult[]>;

  /**
   * Update an existing memory item
   * @param id - The memory item ID
   * @param updates - Partial updates to apply
   * @returns The updated item
   */
  update(id: string, updates: Partial<MemoryItemInput>): Promise<MemoryItem>;

  /**
   * Archive a memory item (soft delete)
   * @param id - The memory item ID
   */
  archive(id: string): Promise<void>;

  /**
   * Permanently delete a memory item
   * @param id - The memory item ID
   */
  delete(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // Query & Retrieval
  // -------------------------------------------------------------------------

  /**
   * Query memory items with filtering and scoring
   * @param query - Query parameters
   * @returns Matching items with metadata
   */
  query(query: MemoryQuery): Promise<MemoryQueryResult>;

  /**
   * Get a single memory item by ID
   * @param id - The memory item ID
   * @returns The memory item or null
   */
  getById(id: string): Promise<MemoryItem | null>;

  /**
   * Get memory items by content hash (for deduplication check)
   * @param contentHash - SHA-256 hash of content
   * @param projectId - Optional project scope
   * @returns Matching items
   */
  getByHash(contentHash: string, projectId?: string): Promise<MemoryItem[]>;

  // -------------------------------------------------------------------------
  // Usage Tracking
  // -------------------------------------------------------------------------

  /**
   * Record usage of a memory item
   * @param input - Usage tracking data
   */
  recordUse(input: MemoryUseInput): Promise<void>;

  /**
   * Get usage history for a run
   * @param runId - The run ID
   * @param limit - Max items to return
   * @returns Memory items used in the run
   */
  getUsesForRun(
    runId: string,
    limit?: number
  ): Promise<Array<{ memoryItem: MemoryItem; usedAt: Date; context: string | null }>>;

  // -------------------------------------------------------------------------
  // Snapshots
  // -------------------------------------------------------------------------

  /**
   * Create a snapshot of memory state for a run
   * @param input - Snapshot creation data
   * @returns The created snapshot ID
   */
  createSnapshot(input: SnapshotInput): Promise<string>;

  /**
   * Get snapshots for a run
   * @param runId - The run ID
   * @returns Array of snapshots
   */
  getSnapshots(
    runId: string
  ): Promise<Array<{ id: string; name: string | null; snapshotAt: Date; totalItems: number }>>;

  /**
   * Get items in a snapshot
   * @param snapshotId - The snapshot ID
   * @returns Memory items in the snapshot
   */
  getSnapshotItems(snapshotId: string): Promise<MemoryItem[]>;

  // -------------------------------------------------------------------------
  // Policy & Budget
  // -------------------------------------------------------------------------

  /**
   * Get or create policy for a project
   * @param projectId - The project ID
   * @returns The policy configuration
   */
  getPolicy(projectId: string): Promise<MemoryPolicyConfig>;

  /**
   * Update policy for a project
   * @param config - The policy configuration
   * @returns The updated policy
   */
  updatePolicy(config: MemoryPolicyConfig): Promise<MemoryPolicyConfig>;

  /**
   * Check budget status for a project
   * @param projectId - The project ID
   * @returns Current budget utilization
   */
  getBudgetStatus(projectId: string): Promise<BudgetStatus>;

  /**
   * Enforce budget by archiving low-score items
   * @param projectId - The project ID
   * @param targetUtilization - Target utilization percent (0-100)
   * @returns Number of items archived
   */
  enforceBudget(projectId: string, targetUtilization?: number): Promise<number>;

  // -------------------------------------------------------------------------
  // Scoring & Maintenance
  // -------------------------------------------------------------------------

  /**
   * Apply score decay to items based on time
   * @param projectId - Optional project scope
   * @returns Number of items updated
   */
  applyScoreDecay(projectId?: string): Promise<number>;

  /**
   * Boost score for accessed items
   * @param itemId - The memory item ID
   * @param boost - Score boost amount (0-1)
   */
  boostScore(itemId: string, boost: number): Promise<void>;

  /**
   * Archive expired items
   * @returns Number of items archived
   */
  archiveExpired(): Promise<number>;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate SHA-256 hash of content for deduplication
 * Uses Node.js crypto module for server-side compatibility
 */
export async function hashContent(content: string): Promise<string> {
  // Use Node.js crypto module for server-side compatibility
  const { createHash } = await import('crypto');
  const hash = createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

/**
 * Estimate token count for content (rough approximation)
 * Uses ~4 chars per token as a rough estimate
 */
export function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}
