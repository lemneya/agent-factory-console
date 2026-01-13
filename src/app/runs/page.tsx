'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

interface Run {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  project: {
    id: string;
    repoName: string;
    repoFullName: string;
  };
  _count: {
    tasks: number;
  };
}

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

function RunsContent() {
  const { data: session, status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState<Run[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRun, setNewRun] = useState({ projectId: '', name: '' });

  // Check if demo mode from URL or hook
  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = authStatus === 'authenticated';
  const canViewData = isAuthenticated || isInDemoMode;

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/runs');
      if (!res.ok) throw new Error('Failed to fetch runs');
      const data = await res.json();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects?userId=${session?.user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (canViewData) {
      fetchRuns();
      if (isAuthenticated) {
        fetchProjects();
      }
    } else if (authStatus === 'unauthenticated' && !isInDemoMode) {
      setLoading(false);
    }
  }, [authStatus, canViewData, isAuthenticated, isInDemoMode, fetchRuns, fetchProjects]);

  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    if (!newRun.projectId || !newRun.name) return;

    // Block mutations in demo mode
    if (isInDemoMode && !isAuthenticated) {
      setError('Sign in required to create runs');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRun),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create run');
      }

      setShowModal(false);
      setNewRun({ projectId: '', name: '' });
      await fetchRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
  }

  if (authStatus === 'loading' || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Runs
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent execution runs and task tracking
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="animate-pulse p-6">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show SignedOutCTA if not authenticated and not in demo mode
  if (authStatus === 'unauthenticated' && !isInDemoMode) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Runs
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent execution runs and task tracking
          </p>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to manage runs and track agent execution."
        />
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      {/* Demo mode badge */}
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Runs
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Agent execution runs and task tracking
          </p>
        </div>
        <Link
          href="/runs/new"
          data-testid="runs-new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Run
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {runs.length === 0 ? (
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
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No runs yet</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isInDemoMode
              ? 'No demo runs available. Sign in to create your own runs.'
              : projects.length === 0
                ? 'First sync your repositories, then create a run to start tracking tasks.'
                : 'Create a new run to start tracking agent tasks.'}
          </p>
          {!isInDemoMode && projects.length === 0 && (
            <Link
              href="/projects"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Go to Projects
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
                  Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {runs.map(run => (
                <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/runs/${run.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {run.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {run.project.repoName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(run.status)}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {run._count.tasks}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(run.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Run Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Run</h2>
            <form onSubmit={handleCreateRun} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project
                </label>
                <select
                  value={newRun.projectId}
                  onChange={e => setNewRun({ ...newRun, projectId: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.repoFullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Run Name
                </label>
                <input
                  type="text"
                  value={newRun.name}
                  onChange={e => setNewRun({ ...newRun, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="e.g., Feature Implementation"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function RunsPage() {
  return (
    <Suspense
      fallback={
        <main data-testid="page-root">
          <div className="mb-8">
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Runs
            </h1>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </main>
      }
    >
      <RunsContent />
    </Suspense>
  );
}
