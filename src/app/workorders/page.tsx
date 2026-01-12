'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  key: string;
  title: string;
  summary: string;
  domain: 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'QA' | 'ALGO' | 'INTEGRATION';
  status:
    | 'PLANNED'
    | 'READY'
    | 'BLOCKED'
    | 'IN_PROGRESS'
    | 'WAITING_FOR_APPROVAL'
    | 'DONE'
    | 'ABORTED';
  specIds: string[];
  ownedPaths: string[];
  blueprintVersion: {
    id: string;
    version: number;
    specHash: string;
    blueprint: {
      id: string;
      name: string;
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
  _count: {
    dependedOnBy: number;
    tasks: number;
    auditEvents: number;
  };
  dependsOnCount: number;
  dependedOnByCount: number;
  specCount: number;
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

function LoadingSkeleton() {
  return (
    <main data-testid="page-root">
      <div className="mb-8">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          WorkOrders
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Sliced work units from blueprints</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </main>
  );
}

function WorkOrdersContent() {
  const searchParams = useSearchParams();
  const blueprintVersionId = searchParams.get('blueprintVersionId');
  const projectId = searchParams.get('projectId');
  const statusFilter = searchParams.get('status');
  const domainFilter = searchParams.get('domain');

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (blueprintVersionId) params.set('blueprintVersionId', blueprintVersionId);
        if (projectId) params.set('projectId', projectId);
        if (statusFilter) params.set('status', statusFilter);
        if (domainFilter) params.set('domain', domainFilter);

        const res = await fetch(`/api/workorders?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch workorders');
        const data = await res.json();
        setWorkOrders(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkOrders();
  }, [blueprintVersionId, projectId, statusFilter, domainFilter]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Group by domain for visualization
  const groupedByDomain = workOrders.reduce(
    (acc, wo) => {
      if (!acc[wo.domain]) acc[wo.domain] = [];
      acc[wo.domain].push(wo);
      return acc;
    },
    {} as Record<string, WorkOrder[]>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          WorkOrders
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {workOrders.length} work units
          {blueprintVersionId && workOrders[0]?.blueprintVersion && (
            <span>
              {' '}
              from{' '}
              <Link
                href={`/blueprints/${workOrders[0].blueprintVersion.blueprint.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {workOrders[0].blueprintVersion.blueprint.name} v
                {workOrders[0].blueprintVersion.version}
              </Link>
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {workOrders.length === 0 ? (
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
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No WorkOrders yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            WorkOrders are created by slicing a published Blueprint version.
          </p>
          <Link
            href="/blueprints"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Blueprints
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByDomain)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([domain, orders]) => (
              <div key={domain}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${domainColors[domain]}`}
                  >
                    {domain}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">({orders.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {orders.map(wo => (
                    <Link
                      key={wo.id}
                      href={`/workorders/${wo.id}`}
                      data-testid={`workorder-card-${wo.key}`}
                      className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                              {wo.key}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[wo.status]}`}
                            >
                              {wo.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {wo.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                        {wo.summary}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span title="Spec IDs">{wo.specCount} specs</span>
                        {wo.dependsOnCount > 0 && (
                          <span title="Dependencies">
                            {wo.dependsOnCount} dep{wo.dependsOnCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {wo.dependedOnByCount > 0 && (
                          <span title="Dependents">
                            {wo.dependedOnByCount} dependent{wo.dependedOnByCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="ml-auto">{formatDate(wo.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WorkOrdersContent />
    </Suspense>
  );
}
