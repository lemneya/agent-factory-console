import { NextRequest } from 'next/server';

export interface PaginationParams {
  cursor?: string;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    total: number;
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from a request URL.
 */
export function parsePaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);

  const cursor = searchParams.get('cursor') || undefined;
  const limitParam = searchParams.get('limit');
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  return { cursor, limit, sortBy, sortOrder };
}

/**
 * Build Prisma pagination options from pagination params.
 */
export function buildPrismaOptions(params: PaginationParams) {
  const options: {
    take: number;
    skip?: number;
    cursor?: { id: string };
  } = {
    take: params.limit + 1, // Take one extra to determine if there are more
  };

  if (params.cursor) {
    options.cursor = { id: params.cursor };
    options.skip = 1; // Skip the cursor itself
  }

  return options;
}

/**
 * Create a paginated response from query results.
 */
export function createPaginatedResponse<T extends { id: string }>(
  items: T[],
  params: PaginationParams,
  total: number
): PaginatedResponse<T> {
  const hasMore = items.length > params.limit;
  const data = hasMore ? items.slice(0, params.limit) : items;
  const lastItem = data[data.length - 1];

  return {
    data,
    pagination: {
      cursor: hasMore && lastItem ? lastItem.id : null,
      hasMore,
      total,
    },
  };
}

/**
 * Build sort options for Prisma query.
 */
export function buildSortOptions(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  defaultSort: string = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field = sortBy || defaultSort;
  return { [field]: sortOrder };
}
