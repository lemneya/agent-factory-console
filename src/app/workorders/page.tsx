'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

interface WorkOrder {
  id: string;
  key: string;
  domain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function WorkOrdersContent() {
  const { status } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = status === 'authenticated';
  const canViewData = isAuthenticated || isInDemoMode;

  const fetchWorkorders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workorders');
      if (!res.ok) throw new Error('Failed to fetch workorders');
      const data = await res.json();
      setWorkorders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewData) {
      fetchWorkorders();
    } else if (status === 'unauthenticated' && !isInDemoMode) {
      setLoading(false);
    }
  }, [status, canViewData, isInDemoMode, fetchWorkorders]);

  function getStatusBadge(s: string) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
      READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
      ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
      IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    };
    return styles[s] || 'bg-gray-100 text-gray-800';
  }

  if (status === 'loading' || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            WorkOrders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track sliced work units from blueprints
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated' && !isInDemoMode) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            WorkOrders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track sliced work units from blueprints
          </p>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to view and manage work orders."
        />
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

      <div className="mb-8">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          WorkOrders
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track sliced work units from blueprints
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {workorders.length === 0 ? (
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
            No work orders yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isInDemoMode
              ? 'No demo work orders available. Sign in to slice blueprints.'
              : 'Work orders are created by slicing published blueprints.'}
          </p>
          {!isInDemoMode && (
            <Link
              href="/blueprints"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Go to Blueprints
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {workorders.map(wo => (
                <tr key={wo.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/workorders/${wo.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {wo.key}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {wo.domain}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(wo.status)}`}
                    >
                      {wo.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(wo.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense
      fallback={
        <main data-testid="page-root">
          <div className="mb-8">
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              WorkOrders
            </h1>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </main>
      }
    >
      <WorkOrdersContent />
    </Suspense>
  );
}
