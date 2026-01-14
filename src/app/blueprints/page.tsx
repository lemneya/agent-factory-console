'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getNavItem } from '@/config/nav';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

const navItem = getNavItem('blueprints');

function BlueprintsContent() {
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
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Structured specifications for agent work
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
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Structured specifications for agent work
          </p>
        </div>
        <SignedOutCTA title="Sign in required" reason="Sign in with GitHub to manage blueprints." />
      </div>
    );
  }

  return (
    <div data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Structured specifications for agent work
          </p>
        </div>
        {isInDemoMode && <DemoModeBadge />}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No blueprints yet</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create your first blueprint to define structured work specifications for agents.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function BlueprintsPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="page-root">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Blueprints
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Structured specifications for agent work
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <BlueprintsContent />
    </Suspense>
  );
}
