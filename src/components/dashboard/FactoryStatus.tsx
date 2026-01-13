"use client";

import { useEffect, useState } from "react";

interface FactoryStats {
  adoptCount: number;
  adaptCount: number;
  buildCount: number;
  prOpenCount: number;
  workersOnline: number;
  runsActive: number;
  runsQueued: number;
  councilBlocks: number;
  lastWebhookReceivedAt: string | null;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function FactoryStatus() {
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch {
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="factory-status"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Factory Status
        </h2>
        <div className="animate-pulse grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="factory-status"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Factory Status
        </h2>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  const counters = [
    {
      label: "ADOPT",
      value: stats?.adoptCount ?? 0,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "ADAPT",
      value: stats?.adaptCount ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "BUILD",
      value: stats?.buildCount ?? 0,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Open PRs",
      value: stats?.prOpenCount ?? 0,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Workers Online",
      value: stats?.workersOnline ?? 0,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Runs Active",
      value: stats?.runsActive ?? 0,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Runs Queued",
      value: stats?.runsQueued ?? 0,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: "Council Blocks",
      value: stats?.councilBlocks ?? 0,
      color: stats?.councilBlocks ? "text-red-600" : "text-gray-600",
      bg: stats?.councilBlocks ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="factory-status"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Factory Status</h2>
        <span className="text-xs text-gray-500">
          Last webhook: {formatTimeAgo(stats?.lastWebhookReceivedAt ?? null)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className={`${counter.bg} rounded-lg p-3 text-center`}
            data-testid={`stat-${counter.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className={`text-2xl font-bold ${counter.color}`}>
              {counter.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">{counter.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
