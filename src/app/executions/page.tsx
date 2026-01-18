'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';
import { RefreshCw, ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ExecutionRun {
  id: string;
  targetRepoOwner: string;
  targetRepoName: string;
  targetBranch: string;
  sourceBranch: string;
  status: string;
  workOrderIds: string[];
  prNumber: number | null;
  prUrl: string | null;
  prTitle: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  logs?: Array<{
    id: string;
    phase: string;
    level: string;
    message: string;
    createdAt: string;
  }>;
}

function ExecutionsContent() {
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();

  // Check if demo mode from URL or hook
  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';

  // State
  const [executions, setExecutions] = useState<ExecutionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch executions
  const fetchExecutions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/runner/runs');
      if (!response.ok) {
        throw new Error('Failed to fetch executions');
      }
      const data = await response.json();
      setExecutions(data.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' || isInDemoMode) {
      fetchExecutions();
    }
  }, [authStatus, isInDemoMode, fetchExecutions]);

  // Status icon and colors
  const getStatusDisplay = (status: string) => {
    const statusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
      PENDING: {
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      CLONING: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      APPLYING: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      BUILDING: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      TESTING: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      CREATING_PR: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      },
      COMPLETED: {
        icon: <CheckCircle className="h-4 w-4" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      FAILED: {
        icon: <XCircle className="h-4 w-4" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    };
    return statusConfig[status] || statusConfig.PENDING;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Show loading state
  if (authStatus === 'loading') {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Executions
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track WorkOrder execution runs and PR creation
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // Show SignedOutCTA if not authenticated and not in demo mode
  if (authStatus === 'unauthenticated' && !isInDemoMode) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Executions
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track WorkOrder execution runs and PR creation
          </p>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to view execution runs."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Executions
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track WorkOrder execution runs and PR creation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isInDemoMode && <DemoModeBadge />}
          <button
            onClick={fetchExecutions}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/workorders"
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            View WorkOrders
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && executions.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No executions yet</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Execute a WorkOrder to see execution runs here.
          </p>
          <Link
            href="/workorders"
            className="mt-6 inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            Go to WorkOrders
          </Link>
        </div>
      )}

      {/* Executions table */}
      {!isLoading && !error && executions.length > 0 && (
        <div
          className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          data-testid="executions-table"
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  PR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {executions.map((execution) => {
                const statusDisplay = getStatusDisplay(execution.status);
                return (
                  <tr
                    key={execution.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    data-testid={`execution-row-${execution.id}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                      {execution.id.slice(0, 8)}...
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{execution.targetRepoOwner}</span>/
                      {execution.targetRepoName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusDisplay.className}`}
                      >
                        {statusDisplay.icon}
                        {execution.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {execution.prUrl ? (
                        <a
                          href={execution.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          PR #{execution.prNumber}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(execution.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Link
                        href={`/executions/${execution.id}`}
                        className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ExecutionsPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="page-root">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Executions
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Track WorkOrder execution runs and PR creation
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <ExecutionsContent />
    </Suspense>
  );
}
