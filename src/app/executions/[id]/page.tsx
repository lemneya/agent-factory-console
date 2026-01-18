'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SignedOutCTA, useDemoMode } from '@/components/auth';
import {
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  GitBranch,
  FileText,
} from 'lucide-react';

interface ExecutionLog {
  id: string;
  phase: string;
  level: string;
  message: string;
  createdAt: string;
  detailsJson?: Record<string, unknown>;
}

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
  prBody: string | null;
  errorMessage: string | null;
  cloneLog: string | null;
  buildLog: string | null;
  testLog: string | null;
  prCreationLog: string | null;
  evidencePath: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  logs: ExecutionLog[];
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();

  // State
  const [execution, setExecution] = useState<ExecutionRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch execution details
  const fetchExecution = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/runner/runs/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Execution not found');
        }
        throw new Error('Failed to fetch execution');
      }
      const data = await response.json();
      setExecution(data.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === 'authenticated' || isDemoMode) {
      fetchExecution();
    }
  }, [authStatus, isDemoMode, fetchExecution]);

  // Auto-refresh for in-progress executions
  useEffect(() => {
    if (!execution) return;
    const inProgressStatuses = [
      'PENDING',
      'CLONING',
      'APPLYING',
      'BUILDING',
      'TESTING',
      'CREATING_PR',
    ];
    if (inProgressStatuses.includes(execution.status)) {
      const interval = setInterval(fetchExecution, 3000);
      return () => clearInterval(interval);
    }
  }, [execution, fetchExecution]);

  // Status icon and colors
  const getStatusDisplay = (status: string) => {
    const statusConfig: Record<
      string,
      { icon: React.ReactNode; className: string; label: string }
    > = {
      PENDING: {
        icon: <Clock className="h-5 w-5" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: 'Pending',
      },
      CLONING: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Cloning Repository',
      },
      APPLYING: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Applying Changes',
      },
      BUILDING: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Building',
      },
      TESTING: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Running Tests',
      },
      CREATING_PR: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        label: 'Creating PR',
      },
      COMPLETED: {
        icon: <CheckCircle className="h-5 w-5" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        label: 'Completed',
      },
      FAILED: {
        icon: <XCircle className="h-5 w-5" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: 'Failed',
      },
    };
    return statusConfig[status] || statusConfig.PENDING;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get log level color
  const getLogLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      INFO: 'text-blue-600 dark:text-blue-400',
      WARN: 'text-yellow-600 dark:text-yellow-400',
      ERROR: 'text-red-600 dark:text-red-400',
      DEBUG: 'text-gray-500 dark:text-gray-400',
    };
    return colors[level] || colors.INFO;
  };

  // Show loading state
  if (authStatus === 'loading' || (isLoading && !execution)) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <Link
            href="/executions"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Executions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Execution Details
          </h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // Show SignedOutCTA if not authenticated and not in demo mode
  if (authStatus === 'unauthenticated' && !isDemoMode) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Execution Details
          </h1>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to view execution details."
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <Link
            href="/executions"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Executions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Execution Details
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link
            href="/executions"
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Executions
          </Link>
        </div>
      </div>
    );
  }

  if (!execution) return null;

  const statusDisplay = getStatusDisplay(execution.status);

  return (
    <div data-testid="page-root">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/executions"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Executions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Execution: {execution.id.slice(0, 8)}...
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {execution.targetRepoOwner}/{execution.targetRepoName}
            </p>
          </div>
          <button
            onClick={fetchExecution}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading}
            data-testid="execution-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusDisplay.className}`}
              data-testid="execution-status"
            >
              {statusDisplay.icon}
              {statusDisplay.label}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GitBranch className="h-4 w-4" />
              {execution.sourceBranch} → {execution.targetBranch}
            </div>
          </div>
          {execution.prUrl && (
            <a
              href={execution.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              data-testid="execution-pr-link"
            >
              <ExternalLink className="h-4 w-4" />
              View PR #{execution.prNumber}
            </a>
          )}
        </div>

        {/* Error message */}
        {execution.errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{execution.errorMessage}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Created
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(execution.createdAt)}
            </p>
          </div>
          {execution.completedAt && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(execution.completedAt)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              WorkOrders
            </p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {execution.workOrderIds.length}
            </p>
          </div>
          {execution.prTitle && (
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                PR Title
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{execution.prTitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Execution Logs */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Execution Logs</h2>
        </div>
        <div
          className="max-h-96 overflow-y-auto p-4 font-mono text-sm"
          data-testid="execution-logs"
        >
          {execution.logs && execution.logs.length > 0 ? (
            <div className="space-y-2">
              {execution.logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded bg-gray-50 p-2 dark:bg-gray-700/50"
                >
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span
                    className={`w-12 text-xs font-medium uppercase ${getLogLevelColor(log.level)}`}
                  >
                    {log.level}
                  </span>
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                    {log.phase}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No logs available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
