'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getNavItem } from '@/config/nav';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

const navItem = getNavItem('workorders');

function WorkOrdersContent() {
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const Icon = navItem?.icon;

  // Check if demo mode from URL or hook
  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';

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
        {isInDemoMode && <DemoModeBadge />}
      </div>

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
