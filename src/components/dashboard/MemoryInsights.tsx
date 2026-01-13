"use client";

import { useEffect, useState } from "react";

interface MemoryItem {
  id: string;
  summary: string | null;
  category: string;
  scope: string;
  accessCount: number;
  lastAccessed: string | null;
  project: {
    repoName: string;
  } | null;
}

interface CategoryBreakdown {
  category: string;
  count: number;
}

interface MemoryData {
  topMemoryItems: MemoryItem[];
  recentUseCount: number;
  totalMemoryItems: number;
  categoryBreakdown: CategoryBreakdown[];
}

const categoryColors: Record<string, string> = {
  CODE: "bg-blue-100 text-blue-700",
  DOCUMENTATION: "bg-green-100 text-green-700",
  DECISION: "bg-purple-100 text-purple-700",
  ERROR: "bg-red-100 text-red-700",
  CONTEXT: "bg-gray-100 text-gray-700",
  CUSTOM: "bg-orange-100 text-orange-700",
};

const categoryIcons: Record<string, string> = {
  CODE: "💻",
  DOCUMENTATION: "📄",
  DECISION: "⚖️",
  ERROR: "🐛",
  CONTEXT: "📌",
  CUSTOM: "🏷️",
};

export function MemoryInsights() {
  const [data, setData] = useState<MemoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemory() {
      try {
        const res = await fetch("/api/dashboard/memory");
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        setData(result);
        setError(null);
      } catch {
        setError("Failed to load memory insights");
      } finally {
        setLoading(false);
      }
    }
    fetchMemory();
  }, []);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="memory-insights"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Memory Insights
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="memory-insights"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Memory Insights
        </h2>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  const hasData =
    data && (data.totalMemoryItems > 0 || data.topMemoryItems.length > 0);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="memory-insights"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Memory Insights</h2>
        <div className="text-xs text-gray-500">
          {data?.recentUseCount || 0} uses (7d)
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-gray-500">
          <svg
            className="w-10 h-10 mx-auto mb-2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-sm">No memory items yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Memory will be populated as agents run
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {data?.totalMemoryItems || 0}
              </div>
              <div className="text-xs text-gray-600">Total Items</div>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-teal-600">
                {data?.categoryBreakdown?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Categories</div>
            </div>
          </div>

          {/* Top Memory Items */}
          {data?.topMemoryItems && data.topMemoryItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Most Accessed
              </h3>
              <div className="space-y-2">
                {data.topMemoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    data-testid={`memory-item-${item.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {categoryIcons[item.category] || "📌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {item.summary || "Untitled memory"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span
                            className={`px-1.5 py-0.5 rounded ${categoryColors[item.category] || "bg-gray-100 text-gray-700"}`}
                          >
                            {item.category}
                          </span>
                          {item.project && <span>{item.project.repoName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.accessCount}
                      </div>
                      <div className="text-xs text-gray-400">hits</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {data?.categoryBreakdown && data.categoryBreakdown.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                By Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.categoryBreakdown.map((cat) => (
                  <span
                    key={cat.category}
                    className={`text-xs px-2 py-1 rounded-full ${categoryColors[cat.category] || "bg-gray-100 text-gray-700"}`}
                  >
                    {cat.category}: {cat.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
