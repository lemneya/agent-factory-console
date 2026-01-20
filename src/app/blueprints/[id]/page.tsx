'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';
import {
  ArrowLeft,
  FileText,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  SkipForward,
  Settings,
} from 'lucide-react';
import { ExecuteWorkOrderModal } from '@/components/workorders';

interface WorkOrder {
  id: string;
  key: string;
  domain: string;
  title: string;
  spec: string | null;
  status: string;
  createdAt: string;
}

interface ProjectRepoConfig {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
}

interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
  workOrders: WorkOrder[];
  statusCounts: Record<string, number>;
  pendingCount: number;
  pendingWorkOrderIds: string[];
  projectRepoConfig: ProjectRepoConfig | null;
  createdAt: string;
  updatedAt: string;
}

export default function BlueprintDetailPage() {
  const params = useParams();

  const id = params.id as string;
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();

  // State
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Fetch blueprint details
  const fetchBlueprint = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blueprints/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blueprint not found');
        }
        throw new Error('Failed to fetch blueprint');
      }
      const data = await response.json();
      setBlueprint(data.blueprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === 'authenticated' || isDemoMode) {
      fetchBlueprint();
    }
  }, [authStatus, isDemoMode, fetchBlueprint]);

  // Handle execute all pending
  const handleExecuteAllPending = async () => {
    if (!blueprint || blueprint.pendingCount === 0) return;

    // AFC-RUNNER-UX-3: Check if project repo config exists
    if (blueprint.projectRepoConfig) {
      // Execute directly with project config (no modal)
      await executeWithConfig(
        blueprint.projectRepoConfig.repoOwner,
        blueprint.projectRepoConfig.repoName,
        blueprint.projectRepoConfig.baseBranch
      );
    } else {
      // No config available - show modal to collect repo info
      setShowExecuteModal(true);
    }
  };

  // Execute with provided config
  const executeWithConfig = async (owner: string, repo: string, branch: string) => {
    try {
      const response = await fetch('/api/runner/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRepoOwner: owner,
          targetRepoName: repo,
          targetBranch: branch,
          workOrderIds: blueprint!.pendingWorkOrderIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute work orders');
      }

      // Navigate to the execution detail page, preserving demo mode if active
      const demoParam = isDemoMode ? '?demo=1' : '';
      window.location.href = `/executions/${data.executionRunId}${demoParam}`;
    } catch (err) {
      console.error('Execute error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute work orders');
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
      IN_PROGRESS: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
      COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
      FAILED: <XCircle className="h-4 w-4 text-red-500" />,
      SKIPPED: <SkipForward className="h-4 w-4 text-gray-500" />,
    };
    return icons[status] || <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      SKIPPED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Show loading state
  if (authStatus === 'loading' || (isLoading && !blueprint)) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <Link
            href="/blueprints"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blueprints
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Blueprint Details
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
            Blueprint Details
          </h1>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to view blueprint details."
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
            href="/blueprints"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blueprints
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Blueprint Details
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link
            href="/blueprints"
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Blueprints
          </Link>
        </div>
      </div>
    );
  }

  if (!blueprint) return null;

  return (
    <div data-testid="page-root">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/blueprints"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blueprints
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-gray-900 dark:text-white"
                data-testid="page-title"
              >
                {blueprint.name}
              </h1>
              {isDemoMode && <DemoModeBadge />}
            </div>
            {blueprint.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">{blueprint.description}</p>
            )}
          </div>
          <button
            onClick={handleExecuteAllPending}
            disabled={blueprint.pendingCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="blueprint-execute-pending"
          >
            <Play className="h-4 w-4" />
            Execute all PENDING ({blueprint.pendingCount})
          </button>
        </div>
      </div>

      {/* AFC-RUNNER-UX-3: Missing repo config warning */}
      {!blueprint.projectRepoConfig && blueprint.projectId && (
        <div
          className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
          data-testid="blueprint-missing-repo-config"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Repository Configuration Required
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                This blueprint is linked to a project, but repository settings are not configured.
                Please configure the repository settings to execute work orders without manual
                input.
              </p>
              <Link
                href={`/projects/${blueprint.projectId}/settings`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                data-testid="blueprint-go-to-project-settings"
              >
                <Settings className="h-4 w-4" />
                Configure Project Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'].map(status => (
          <div
            key={status}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(status)}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {blueprint.statusCounts[status] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Work Orders List */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FileText className="h-5 w-5" />
            Work Orders ({blueprint.workOrders.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {blueprint.workOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No work orders in this blueprint
            </div>
          ) : (
            blueprint.workOrders.map(wo => (
              <div
                key={wo.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/workorders?focus=${wo.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                    >
                      {wo.title}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(wo.status)}`}
                    >
                      {getStatusIcon(wo.status)}
                      {wo.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{wo.key}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                      {wo.domain}
                    </span>
                    <span>{formatDate(wo.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execute Modal */}
      <ExecuteWorkOrderModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        workOrderIds={blueprint.pendingWorkOrderIds}
        workOrderTitles={blueprint.workOrders
          .filter(wo => wo.status === 'PENDING')
          .map(wo => wo.title)}
      />
    </div>
  );
}
