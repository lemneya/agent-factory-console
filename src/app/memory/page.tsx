"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SignInRequired, EmptyState } from "@/components/auth";

interface MemoryItem {
  id: string;
  scope: string;
  category: string;
  summary: string;
  content: string;
  accessCount: number;
  lastAccessed: string;
  project?: {
    repoName: string;
  };
}

const categoryColors: Record<string, string> = {
  CODE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DECISION: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DOCUMENTATION: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PATTERN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function MemoryPage() {
  const { status } = useSession();
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemory() {
      try {
        const res = await fetch("/api/memory");
        if (!res.ok) throw new Error("Failed to fetch memory items");
        const data = await res.json();
        setMemoryItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMemory();
  }, []);

  if (status === "loading" || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Memory
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent memory layer for patterns, decisions, and learnings
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Memory
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent memory layer for patterns, decisions, and learnings
          </p>
        </div>
        <SignInRequired
          title="Sign in to view memory"
          description="Access the agent memory layer containing patterns, decisions, and learnings from past runs."
          showDemoOption={true}
          demoPath="/memory?demo=true"
        />
      </main>
    );
  }

  if (error) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Memory
          </h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Memory
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent memory layer for patterns, decisions, and learnings
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {memoryItems.length} items
        </div>
      </div>

      {memoryItems.length === 0 ? (
        <EmptyState
          icon="memory"
          title="No memory items yet"
          description="Memory items are created automatically as agents learn patterns, make decisions, and encounter errors."
          ctaText="Start a Run"
          ctaHref="/runs"
          secondaryText="Learn about memory"
          secondaryHref="/docs/memory"
        />
      ) : (
        <div className="space-y-4">
          {memoryItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        categoryColors[item.category] ||
                        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.scope}
                    </span>
                  </div>
                  <h3 className="mt-2 font-medium text-gray-900 dark:text-white">
                    {item.summary}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.accessCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    hits
                  </div>
                </div>
              </div>
              {item.project && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {item.project.repoName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
