"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SignInRequired, EmptyState } from "@/components/auth";

interface AuditEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const typeColors: Record<string, { bg: string; icon: string }> = {
  workorder_status: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "📋",
  },
  terminal_iteration: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: "🖥️",
  },
  council_decision: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: "⚖️",
  },
  worker_log: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "🤖",
  },
  mode_change: {
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: "🔄",
  },
};

export default function AuditPage() {
  const { status } = useSession();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch("/api/dashboard/audit?limit=50");
        if (!res.ok) throw new Error("Failed to fetch audit events");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAudit();
  }, []);

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  if (status === "loading" || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Audit Log
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Complete activity trail across all factory operations
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
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
            Audit Log
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Complete activity trail across all factory operations
          </p>
        </div>
        <SignInRequired
          title="Sign in to view audit log"
          description="Access the complete activity trail including terminal events, mode changes, and approvals."
          showDemoOption={true}
          demoPath="/audit?demo=true"
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
            Audit Log
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
            Audit Log
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Complete activity trail across all factory operations
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {events.length} events
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon="audit"
          title="No audit events yet"
          description="Audit events are recorded automatically as agents perform operations, make decisions, and change states."
          ctaText="Start a Run"
          ctaHref="/runs"
          secondaryText="Learn about auditing"
          secondaryHref="/docs/audit"
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => {
              const typeConfig = typeColors[event.type] || {
                bg: "bg-gray-100 dark:bg-gray-700",
                icon: "📌",
              };
              return (
                <div key={event.id} className="flex items-start gap-4 p-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${typeConfig.bg}`}
                  >
                    <span className="text-lg">{typeConfig.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                      {event.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
                        {event.type.replace(/_/g, " ")}
                      </span>
                      {event.actor && <span>by {event.actor}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(event.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
