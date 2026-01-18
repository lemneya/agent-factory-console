'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getNavItem } from '@/config/nav';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';
import { ExecuteWorkOrderModal } from '@/components/workorders';
import { Play, RefreshCw, ExternalLink } from 'lucide-react';

const navItem = getNavItem('workorders');

interface WorkOrder {
  id: string;
  key: string;
  domain: string;
  title: string;
  spec: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  dependsOn: string[];
  blueprint?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

function WorkOrdersContent() {
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const Icon = navItem?.icon;

  // Check if demo mode from URL or hook
  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workorders');
      if (!response.ok) {
        throw new Error('Failed to fetch work orders');
      }
      const data = await response.json();
      setWorkOrders(data.workOrders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' || isInDemoMode) {
      fetchWorkOrders();
    }
  }, [authStatus, isInDemoMode, fetchWorkOrders]);

  // Handle execute button click
  const handleExecuteClick = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkOrder(null);
  };

  // Status badge colors
  const getStatusBadge = (status: WorkOrder['status']) => {
    const styles: Record<WorkOrder['status'], string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      SKIPPED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
    return styles[status];
  };

  // Show loading state
  if (authStatus === 'loading') {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            WorkOrders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Sliced work units from blueprints</p>
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
            WorkOrders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Sliced work units from blueprints</p>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to manage work orders."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            WorkOrders
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Sliced work units from blueprints</p>
        </div>
        <div className="flex items-center gap-3">
          {isInDemoMode && <DemoModeBadge />}
          <button
            onClick={fetchWorkOrders}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/executions"
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <ExternalLink className="h-4 w-4" />
            View Executions
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
      {!isLoading && !error && workOrders.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          {Icon && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
              <Icon className="h-8 w-8" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No work orders yet</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Work orders are created when blueprints are sliced. Create a blueprint first.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            Back to Dashboard
          </Link>
        </div>
      )}

      {/* WorkOrders table */}
      {!isLoading && !error && workOrders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" data-testid="workorders-table">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Blueprint
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {workOrders.map((workOrder) => (
                <tr
                  key={workOrder.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  data-testid={`workorder-row-${workOrder.id}`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {workOrder.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {workOrder.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                      {workOrder.domain}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(workOrder.status)}`}
                    >
                      {workOrder.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {workOrder.blueprint?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {workOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handleExecuteClick(workOrder)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700"
                        data-testid={`execute-workorder-${workOrder.id}`}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Execute
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Execute Modal */}
      <ExecuteWorkOrderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        workOrderIds={selectedWorkOrder ? [selectedWorkOrder.id] : []}
        workOrderTitles={selectedWorkOrder ? [selectedWorkOrder.title] : []}
      />
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="page-root">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              WorkOrders
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Sliced work units from blueprints
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <WorkOrdersContent />
    </Suspense>
  );
}
