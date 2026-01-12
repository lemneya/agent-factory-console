'use client';

/**
 * AFC-1.6: Memory Layer MVP - Memory Panel Component
 *
 * Displays memory items, usage history, and snapshots for a run.
 * Used on the Run Detail page.
 */

import { useEffect, useState, useCallback } from 'react';

interface MemoryItem {
  id: string;
  content: string;
  summary: string | null;
  category: string;
  score: number;
  tokenCount: number;
  accessCount: number;
  lastAccessed: string | null;
  createdAt: string;
}

interface MemoryUse {
  memoryItem: {
    id: string;
    content: string;
    summary: string | null;
    category: string;
    score: number;
    tokenCount: number;
  };
  usedAt: string;
  context: string | null;
}

interface Snapshot {
  id: string;
  name: string | null;
  snapshotAt: string;
  totalItems: number;
}

interface MemoryPanelProps {
  runId: string;
  projectId: string;
}

type TabType = 'items' | 'uses' | 'snapshots';

const CATEGORY_COLORS: Record<string, string> = {
  CODE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
  DOCUMENTATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  DECISION: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
  CONTEXT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  CUSTOM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
};

export default function MemoryPanel({ runId, projectId }: MemoryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [uses, setUses] = useState<MemoryUse[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/memory/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          runId,
          limit: 50,
          orderBy: 'score',
          orderDirection: 'desc',
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch memory items');

      const data = await res.json();
      setItems(data.items);
      setTokenCount(data.tokenCount);
      setTotalItems(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [projectId, runId]);

  const fetchUses = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}/memory/uses?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch memory uses');

      const data = await res.json();
      setUses(data.uses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [runId]);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}/memory/snapshots`);
      if (!res.ok) throw new Error('Failed to fetch snapshots');

      const data = await res.json();
      setSnapshots(data.snapshots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [runId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchItems(), fetchUses(), fetchSnapshots()]).finally(() => setLoading(false));
  }, [fetchItems, fetchUses, fetchSnapshots]);

  const tabs = [
    { id: 'items' as TabType, label: 'Memory Items', count: totalItems },
    { id: 'uses' as TabType, label: 'Usage History', count: uses.length },
    { id: 'snapshots' as TabType, label: 'Snapshots', count: snapshots.length },
  ];

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 space-y-3">
            <div className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tokenCount.toLocaleString()} tokens
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-4">
        {activeTab === 'items' && <ItemsList items={items} />}
        {activeTab === 'uses' && <UsesList uses={uses} />}
        {activeTab === 'snapshots' && <SnapshotsList snapshots={snapshots} />}
      </div>
    </div>
  );
}

function ItemsList({ items }: { items: MemoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No memory items found for this run
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
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
            </div>
            <span className="text-xs text-gray-400">{item.accessCount} uses</span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
            {item.summary || item.content}
          </p>
        </div>
      ))}
    </div>
  );
}

function UsesList({ uses }: { uses: MemoryUse[] }) {
  if (uses.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No memory usage recorded for this run
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uses.map((use, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[use.memoryItem.category] || CATEGORY_COLORS.CONTEXT}`}
            >
              {use.memoryItem.category}
            </span>
            <span className="text-xs text-gray-400">{new Date(use.usedAt).toLocaleString()}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
            {use.memoryItem.summary || use.memoryItem.content}
          </p>
          {use.context && (
            <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
              Context: {use.context}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function SnapshotsList({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No snapshots created for this run
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snapshots.map(snapshot => (
        <div
          key={snapshot.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-600"
        >
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {snapshot.name || 'Unnamed Snapshot'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(snapshot.snapshotAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {snapshot.totalItems} items
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
