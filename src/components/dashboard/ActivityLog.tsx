"use client";

import { useEffect, useState } from "react";

interface AuditEvent {
  id: string;
  type: string;
  actor: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  WORKORDER_STATUS: "📋",
  TERMINAL_ITERATION: "🖥️",
  COUNCIL_DECISION: "⚖️",
  WORKER_LOG: "🤖",
};

const typeColors: Record<string, string> = {
  WORKORDER_STATUS: "border-l-blue-500",
  TERMINAL_ITERATION: "border-l-purple-500",
  COUNCIL_DECISION: "border-l-green-500",
  WORKER_LOG: "border-l-orange-500",
};

const typeBadgeColors: Record<string, string> = {
  WORKORDER_STATUS: "bg-blue-100 text-blue-700",
  TERMINAL_ITERATION: "bg-purple-100 text-purple-700",
  COUNCIL_DECISION: "bg-green-100 text-green-700",
  WORKER_LOG: "bg-orange-100 text-orange-700",
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

function formatType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function ActivityLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch("/api/dashboard/audit");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setEvents(data.events || []);
        setError(null);
      } catch {
        setError("Failed to load activity log");
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
    const interval = setInterval(fetchAudit, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4"
        data-testid="activity-log"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Log
        </h2>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
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
        data-testid="activity-log"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Log
        </h2>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      data-testid="activity-log"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
        <span className="text-xs text-gray-500">Last 10 events</span>
      </div>

      {events.length === 0 ? (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No activity yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Events will appear as agents work
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-3 bg-gray-50 rounded-lg border-l-4 ${typeColors[event.type] || "border-l-gray-300"}`}
              data-testid={`audit-event-${event.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">
                    {typeIcons[event.type] || "📝"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${typeBadgeColors[event.type] || "bg-gray-100 text-gray-700"}`}
                      >
                        {formatType(event.type)}
                      </span>
                      {event.actor && (
                        <span className="text-xs text-gray-500">
                          by {event.actor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
