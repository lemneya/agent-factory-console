"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RunSummary {
  id: string;
  name: string;
  status: string;
  ralphMode: boolean;
  createdAt: string;
  completedAt: string | null;
  project: {
    repoName: string;
    repoFullName: string;
  };
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    failed: number;
  };
  checkpointCount: number;
  iterationCount: number;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  QUEUED: "bg-blue-100 text-blue-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  ABORTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
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

export function LastRunSummary() {
  const [run, setRun] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRun() {
      try {
        const res = await fetch("/api/dashboard/runs");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRun(data.run);
        setError(null);
      } catch {
        setError("Failed to load run summary");
      } finally {
        setLoading(false);
      }
    }
    fetchRun();
  }, []);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="last-run-summary"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Last Run Summary
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-100 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="last-run-summary"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Last Run Summary
        </h2>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="last-run-summary"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Last Run Summary
        </h2>
        <Link
          href="/runs"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all →
        </Link>
      </div>

      {!run ? (
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
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No runs yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Start a run from a project to see summary here
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <Link
                href={`/runs/${run.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {run.name}
              </Link>
              <p className="text-sm text-gray-500">{run.project.repoName}</p>
            </div>
            <div className="flex items-center gap-2">
              {run.ralphMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Ralph Mode
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColors[run.status] || "bg-gray-100 text-gray-700"}`}
              >
                {run.status}
              </span>
            </div>
          </div>

          {/* Task Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Task Progress</span>
              <span>
                {run.taskStats.done}/{run.taskStats.total} done
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              {run.taskStats.done > 0 && (
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(run.taskStats.done / run.taskStats.total) * 100}%`,
                  }}
                />
              )}
              {run.taskStats.inProgress > 0 && (
                <div
                  className="bg-yellow-500 h-full"
                  style={{
                    width: `${(run.taskStats.inProgress / run.taskStats.total) * 100}%`,
                  }}
                />
              )}
              {run.taskStats.failed > 0 && (
                <div
                  className="bg-red-500 h-full"
                  style={{
                    width: `${(run.taskStats.failed / run.taskStats.total) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-lg font-semibold text-gray-900">
                {run.taskStats.todo}
              </div>
              <div className="text-xs text-gray-500">Todo</div>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <div className="text-lg font-semibold text-yellow-600">
                {run.taskStats.inProgress}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="text-lg font-semibold text-green-600">
                {run.taskStats.done}
              </div>
              <div className="text-xs text-gray-500">Done</div>
            </div>
            <div className="bg-red-50 rounded p-2">
              <div className="text-lg font-semibold text-red-600">
                {run.taskStats.failed}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <span>
              {run.checkpointCount} checkpoints · {run.iterationCount}{" "}
              iterations
            </span>
            <span>Started {formatTimeAgo(run.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
