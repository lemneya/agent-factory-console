'use client';

/**
 * AFC-1.6: Memory Layer MVP - Project Memory Page
 *
 * Displays all memory items for a project with filtering and policy editor.
 */

import { useEffect, useState, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PolicyEditor } from '@/components/memory';

interface MemoryItem {
  id: string;
  content: string;
  summary: string | null;
  scope: string;
  category: string;
  source: string | null;
  score: number;
  tokenCount: number;
  accessCount: number;
  lastAccessed: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

interface ProjectMemoryPageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  CODE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
  DOCUMENTATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  DECISION: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
  CONTEXT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  CUSTOM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
};

const SCOPE_COLORS: Record<string, string> = {
  GLOBAL: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-400',
  PROJECT: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-400',
  RUN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
};

type TabType = 'items' | 'policy';

export default function ProjectMemoryPage({ params }: ProjectMemoryPageProps) {
  const { id: projectId } = use(params);
  const { status: authStatus } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [projectId]);

  const fetchMemoryItems = useCallback(async () => {
    try {
      const res = await fetch('/api/memory/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          searchText: searchText || undefined,
          categories: categoryFilter ? [categoryFilter] : undefined,
          limit: 100,
          orderBy: 'score',
          orderDirection: 'desc',
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch memory items');

      const data = await res.json();
      setItems(data.items);
      setTotalItems(data.total);
      setTokenCount(data.tokenCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [projectId, searchText, categoryFilter]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      setLoading(true);
      Promise.all([fetchProject(), fetchMemoryItems()])
        .finally(() => setLoading(false));
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchProject, fetchMemoryItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemoryItems();
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/projects"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Projects
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Project Memory</h1>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sign in required</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in with GitHub to view project memory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to Project
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Memory: {project?.repoFullName || 'Loading...'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalItems.toLocaleString()} items · {tokenCount.toLocaleString()} tokens
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Memory Items
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'policy'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Policy Settings
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-wrap gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search memory items..."
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
            </form>
            <select
              value={categoryFilter || ''}
              onChange={e => setCategoryFilter(e.target.value || null)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="">All Categories</option>
              <option value="CODE">Code</option>
              <option value="DOCUMENTATION">Documentation</option>
              <option value="DECISION">Decision</option>
              <option value="ERROR">Error</option>
              <option value="CONTEXT">Context</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Memory Items List */}
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No memory items
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Memory items will appear here when ingested via the API.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[item.scope] || SCOPE_COLORS.PROJECT}`}
                    >
                      {item.scope}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.CONTEXT}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Score: {item.score.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.tokenCount} tokens
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.accessCount} accesses
                    </span>
                    {item.source && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Source: {item.source}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                    {item.summary || item.content}
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    Created: {new Date(item.createdAt).toLocaleString()}
                    {item.lastAccessed && (
                      <> · Last accessed: {new Date(item.lastAccessed).toLocaleString()}</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'policy' && (
        <PolicyEditor projectId={projectId} onSave={() => fetchMemoryItems()} />
      )}
    </div>
  );
}
