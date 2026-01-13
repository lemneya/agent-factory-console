"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface WorkOrder {
  id: string;
  key: string;
  title: string;
  domain: string;
  status: string;
  updatedAt: string;
  project: {
    repoName: string;
  };
}

const statusColors: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_FOR_APPROVAL: "bg-purple-100 text-purple-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-green-100 text-green-700",
  ABORTED: "bg-gray-200 text-gray-500",
};

const domainColors: Record<string, string> = {
  FRONTEND: "text-blue-600",
  BACKEND: "text-green-600",
  DEVOPS: "text-orange-600",
  QA: "text-purple-600",
  ALGO: "text-pink-600",
  INTEGRATION: "text-teal-600",
};

function formatTimeAgo(dateString: string): string {
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

export function ActiveWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        const res = await fetch("/api/dashboard/workorders");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setWorkOrders(data.workOrders || []);
        setError(null);
      } catch {
        setError("Failed to load work orders");
      } finally {
        setLoading(false);
      }
    }
    fetchWorkOrders();
  }, []);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="active-workorders"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active WorkOrders
        </h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="active-workorders"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active WorkOrders
        </h2>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="active-workorders"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Active WorkOrders
        </h2>
        <Link
          href="/workorders"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all →
        </Link>
      </div>

      {workOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">No active work orders</p>
          <Link
            href="/blueprints"
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Create from Blueprint →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {workOrders.map((wo) => (
            <Link
              key={wo.id}
              href={`/workorders/${wo.id}`}
              className="block p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              data-testid={`workorder-${wo.key}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {wo.key}
                  </span>
                  <span
                    className={`text-xs font-medium ${domainColors[wo.domain] || "text-gray-600"}`}
                  >
                    {wo.domain}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusColors[wo.status] || "bg-gray-100 text-gray-700"}`}
                >
                  {wo.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">{wo.title}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>{wo.project.repoName}</span>
                <span>{formatTimeAgo(wo.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
