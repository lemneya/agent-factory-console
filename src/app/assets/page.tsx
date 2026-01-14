'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getNavItem } from '@/config/nav';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

const navItem = getNavItem('assets');

function AssetsContent() {
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
            Asset Registry
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered resources for your projects
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
            Asset Registry
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered resources for your projects
          </p>
        </div>
        <SignedOutCTA title="Sign in required" reason="Sign in with GitHub to manage assets." />
      </div>
    );
  }

  return (
    <div data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Asset Registry
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered resources for your projects
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isInDemoMode && <DemoModeBadge />}
          <Link
            href="/assets/new"
            className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            New Asset
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search assets..."
            data-testid="assets-search"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={isInDemoMode}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          disabled={isInDemoMode}
        >
          <option value="">All Categories</option>
          <option value="auth">Auth</option>
          <option value="database">Database</option>
          <option value="api">API</option>
          <option value="ui">UI</option>
          <option value="testing">Testing</option>
        </select>
      </div>

      {/* Empty State */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          No assets registered
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Register assets to track images, files, and resources used in your projects.
        </p>
        <Link
          href="/assets/new"
          className="mt-6 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Create First Asset
        </Link>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="page-root">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              data-testid="page-title"
            >
              Asset Registry
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Registered resources for your projects
            </p>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <AssetsContent />
    </Suspense>
  );
}
