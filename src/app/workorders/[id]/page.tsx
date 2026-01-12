'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AuditEvent {
  id: string;
  actor: string | null;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  createdAt: string;
}

interface WorkOrder {
  id: string;
  key: string;
  title: string;
  summary: string;
  domain: 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'QA' | 'ALGO' | 'INTEGRATION';
  status: 'PLANNED' | 'READY' | 'BLOCKED' | 'IN_PROGRESS' | 'WAITING_FOR_APPROVAL' | 'DONE' | 'ABORTED';
  specIds: string[];
  ownedPaths: string[];
  interfaces: Array<{ name: string; path: string; description?: string }>;
  acceptanceChecks: string[];
  assetsToUse: string[];
  memoryHints: string[];
  blueprintVersion: {
    id: string;
    version: number;
    specHash: string;
    publishedAt: string;
    blueprint: {
      id: string;
      name: string;
      projectId: string;
    };
  };
  project: {
    id: string;
    repoName: string;
    repoFullName: string;
  };
  run: {
    id: string;
    name: string;
    status: string;
  } | null;
  dependsOn: Array<{
    dependsOn: {
      id: string;
      key: string;
      title: string;
      domain: string;
      status: string;
    };
  }>;
  dependedOnBy: Array<{
    workOrder: {
      id: string;
      key: string;
      title: string;
      domain: string;
      status: string;
    };
  }>;
  tasks: Array<{
    task: {
      id: string;
      title: string;
      status: string;
    };
  }>;
  auditEvents: AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

const domainColors: Record<string, string> = {
  FRONTEND: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
  BACKEND: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  DEVOPS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
  QA: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ALGO: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-400',
  INTEGRATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-400',
};

const statusColors: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  WAITING_FOR_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ABORTED: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLANNED: ['READY', 'BLOCKED', 'ABORTED'],
  READY: ['IN_PROGRESS', 'BLOCKED', 'ABORTED'],
  BLOCKED: ['READY', 'ABORTED'],
  IN_PROGRESS: ['WAITING_FOR_APPROVAL', 'DONE', 'BLOCKED', 'ABORTED'],
  WAITING_FOR_APPROVAL: ['IN_PROGRESS', 'DONE', 'ABORTED'],
  DONE: [],
  ABORTED: [],
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reason, setReason] = useState('');

  const fetchWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workorders/${workOrderId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('WorkOrder not found');
        throw new Error('Failed to fetch workorder');
      }
      const data = await res.json();
      setWorkOrder(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  async function handleStatusChange(newStatus: string) {
    if (!workOrder) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/workorders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
          actor: 'user', // In production, get from session
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to update status');
      }

      setReason('');
      await fetchWorkOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <main data-testid="page-root">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    );
  }

  if (error || !workOrder) {
    return (
      <main data-testid="page-root">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/50">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">{error || 'WorkOrder not found'}</h2>
          <Link href="/workorders" className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to WorkOrders
          </Link>
        </div>
      </main>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[workOrder.status] || [];

  return (
    <main data-testid="page-root">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/workorders" className="hover:text-blue-600 dark:hover:text-blue-400">
            WorkOrders
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{workOrder.key}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {workOrder.key}
              </h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${domainColors[workOrder.domain]}`}>
                {workOrder.domain}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[workOrder.status]}`}>
                {workOrder.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{workOrder.title}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{workOrder.summary}</p>
          </div>

          {/* Spec IDs */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spec IDs ({workOrder.specIds.length})</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {workOrder.specIds.map((specId) => (
                <span
                  key={specId}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-mono text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {specId}
                </span>
              ))}
            </div>
          </div>

          {/* Acceptance Checks */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Acceptance Checks ({workOrder.acceptanceChecks.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {workOrder.acceptanceChecks.map((check, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {check}
                </li>
              ))}
            </ul>
          </div>

          {/* Owned Paths */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Owned Paths</h2>
            <div className="mt-3 space-y-1">
              {workOrder.ownedPaths.map((path, i) => (
                <code key={i} className="block text-sm text-gray-600 dark:text-gray-400">
                  {path}
                </code>
              ))}
            </div>
          </div>

          {/* Audit Log */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h2>
            {workOrder.auditEvents.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No status changes yet</p>
            ) : (
              <div className="mt-3 space-y-3">
                {workOrder.auditEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[event.fromStatus]}`}>
                          {event.fromStatus}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[event.toStatus]}`}>
                          {event.toStatus}
                        </span>
                        {event.actor && (
                          <span className="text-gray-500 dark:text-gray-400">by {event.actor}</span>
                        )}
                      </div>
                      {event.reason && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{event.reason}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h2>
            {allowedTransitions.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No transitions available (terminal state)
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="status-reason-input"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Why are you changing status?"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating}
                      data-testid={`transition-btn-${status}`}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${statusColors[status]}`}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dependencies */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dependencies ({workOrder.dependsOn.length})
            </h2>
            {workOrder.dependsOn.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No dependencies</p>
            ) : (
              <div className="mt-3 space-y-2">
                {workOrder.dependsOn.map((dep) => (
                  <Link
                    key={dep.dependsOn.id}
                    href={`/workorders/${dep.dependsOn.id}`}
                    className="block rounded-lg border border-gray-200 p-2 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{dep.dependsOn.key}</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[dep.dependsOn.status]}`}>
                        {dep.dependsOn.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">{dep.dependsOn.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dependents */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dependents ({workOrder.dependedOnBy.length})
            </h2>
            {workOrder.dependedOnBy.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No dependents</p>
            ) : (
              <div className="mt-3 space-y-2">
                {workOrder.dependedOnBy.map((dep) => (
                  <Link
                    key={dep.workOrder.id}
                    href={`/workorders/${dep.workOrder.id}`}
                    className="block rounded-lg border border-gray-200 p-2 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{dep.workOrder.key}</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[dep.workOrder.status]}`}>
                        {dep.workOrder.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">{dep.workOrder.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Blueprint Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Source</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Blueprint:</span>
                <Link
                  href={`/blueprints/${workOrder.blueprintVersion.blueprint.id}`}
                  className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  {workOrder.blueprintVersion.blueprint.name}
                </Link>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Version:</span>
                <span className="ml-2 text-gray-900 dark:text-white">v{workOrder.blueprintVersion.version}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Spec Hash:</span>
                <span className="ml-2 font-mono text-xs text-gray-900 dark:text-white">
                  {workOrder.blueprintVersion.specHash.substring(0, 16)}...
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Project:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{workOrder.project.repoFullName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
