'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    versions: number;
  };
}

function BlueprintsContent() {
  const { status } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = status === 'authenticated';
  const canViewData = isAuthenticated || isInDemoMode;

  const fetchBlueprints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blueprints');
      if (!res.ok) throw new Error('Failed to fetch blueprints');
      const data = await res.json();
      setBlueprints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewData) {
      fetchBlueprints();
    } else if (status === 'unauthenticated' && !isInDemoMode) {
      setLoading(false);
    }
  }, [status, canViewData, isInDemoMode, fetchBlueprints]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (status === 'loading' || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Define and manage agent task blueprints
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
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Define and manage agent task blueprints
          </p>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to create and manage blueprints."
        />
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Define and manage agent task blueprints
          </p>
        </div>
        <Link
          href={isInDemoMode && !isAuthenticated ? '#' : '/blueprints/new'}
          onClick={(e) => {
            if (isInDemoMode && !isAuthenticated) {
              e.preventDefault();
              setError('Sign in required to create blueprints');
            }
          }}
          className={`flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${
            isInDemoMode && !isAuthenticated ? 'cursor-not-allowed opacity-50' : ''
          }`}
          data-testid="new-blueprint-btn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Blueprint
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {blueprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No blueprints yet</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isInDemoMode ? 'No demo blueprints available. Sign in to create your own.' : 'Create a blueprint to define agent task structures.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blueprints.map((blueprint) => (
            <Link key={blueprint.id} href={`/blueprints/${blueprint.id}`} className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{blueprint.name}</h3>
              {blueprint.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{blueprint.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{blueprint._count.versions} versions</span>
                <span className="ml-auto">Updated {formatDate(blueprint.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default function BlueprintsPage() {
  return (
    <Suspense fallback={<main data-testid="page-root"><div className="mb-8"><h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">Blueprints</h1></div><div className="animate-pulse"><div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" /></div></main>}>
      <BlueprintsContent />
    </Suspense>
  );
}
