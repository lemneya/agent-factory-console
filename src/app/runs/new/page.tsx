'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

interface CouncilDecision {
  id: string;
  decision: 'ADOPT' | 'ADAPT' | 'BUILD';
  candidateName: string | null;
}

type RunKind = 'ADOPT' | 'ADAPT' | 'BUILD';

function NewRunContent() {
  const { data: session, status } = useSession();
  const { isDemoMode } = useDemoMode();
  const router = useRouter();
  const searchParams = useSearchParams();

  const demoParam = searchParams.get('demo');
  const preselectedProjectId = searchParams.get('projectId');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = status === 'authenticated';

  const [projects, setProjects] = useState<Project[]>([]);
  const [councilDecisions, setCouncilDecisions] = useState<CouncilDecision[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCouncil, setLoadingCouncil] = useState(false);

  const [formData, setFormData] = useState({
    projectId: preselectedProjectId || '',
    name: '',
    kind: '' as RunKind | '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if BUILD is allowed (has council decision)
  const hasBuildCouncilDecision = councilDecisions.some(d => d.decision === 'BUILD');
  const isBuildBlocked = formData.kind === 'BUILD' && !hasBuildCouncilDecision;

  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const res = await fetch(`/api/projects?userId=${session?.user?.id || ''}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingProjects(false);
    }
  }, [session?.user?.id]);

  const fetchCouncilDecisions = useCallback(async (projectId: string) => {
    if (!projectId) {
      setCouncilDecisions([]);
      return;
    }

    try {
      setLoadingCouncil(true);
      const res = await fetch(`/api/council?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch council decisions');
      const data = await res.json();
      setCouncilDecisions(data);
    } catch (err) {
      console.error('Failed to fetch council decisions:', err);
      setCouncilDecisions([]);
    } finally {
      setLoadingCouncil(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' || isInDemoMode) {
      fetchProjects();
    } else if (status === 'unauthenticated' && !isInDemoMode) {
      setLoadingProjects(false);
    }
  }, [status, isInDemoMode, fetchProjects]);

  useEffect(() => {
    if (formData.projectId) {
      fetchCouncilDecisions(formData.projectId);
    }
  }, [formData.projectId, fetchCouncilDecisions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isInDemoMode && !isAuthenticated) {
      setError('Sign in required to create runs');
      return;
    }

    if (!formData.projectId) {
      setError('Please select a project');
      return;
    }

    if (!formData.kind) {
      setError('Please select a run kind');
      return;
    }

    if (!formData.name.trim()) {
      setError('Run name is required');
      return;
    }

    if (isBuildBlocked) {
      setError(
        'Council decision required for BUILD runs. Please submit a Council evaluation first.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          name: formData.name.trim(),
          kind: formData.kind,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create run');
      }

      const run = await res.json();
      router.push(`/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || loadingProjects) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            New Run
          </h1>
        </div>
        <div className="animate-pulse">
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    );
  }

  // Show SignedOutCTA if not authenticated and not in demo mode
  if (status === 'unauthenticated' && !isInDemoMode) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <Link
            href="/runs"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Runs
          </Link>
          <h1
            data-testid="page-title"
            className="mt-4 text-2xl font-bold text-gray-900 dark:text-white"
          >
            New Run
          </h1>
        </div>
        <SignedOutCTA title="Sign in required" reason="Sign in with GitHub to create a new run." />
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      {/* Demo mode badge */}
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

      <div className="mb-8">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Runs
        </Link>
        <h1
          data-testid="page-title"
          className="mt-4 text-2xl font-bold text-gray-900 dark:text-white"
        >
          New Run
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Start a new agent workflow run</p>
      </div>

      {isInDemoMode && !isAuthenticated && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
          <p className="font-medium">Read-only demo mode</p>
          <p className="mt-1 text-sm">Sign in to create runs.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="space-y-6">
          {/* Project selector */}
          <div>
            <label
              htmlFor="projectId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project <span className="text-red-500">*</span>
            </label>
            <select
              id="projectId"
              data-testid="run-project-select"
              value={formData.projectId}
              onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              disabled={isInDemoMode && !isAuthenticated}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.repoFullName || project.repoName}
                </option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                No projects found.{' '}
                <Link href="/projects/new" className="underline">
                  Create a project first
                </Link>
                .
              </p>
            )}
          </div>

          {/* Run name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Run Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              data-testid="run-name-input"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isInDemoMode && !isAuthenticated}
              placeholder="e.g., Feature implementation run"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Run kind selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Run Kind <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the type of agent workflow
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {/* ADOPT */}
              <button
                type="button"
                data-testid="run-kind-adopt"
                onClick={() => setFormData(prev => ({ ...prev, kind: 'ADOPT' }))}
                disabled={isInDemoMode && !isAuthenticated}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  formData.kind === 'ADOPT'
                    ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                    ✓
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">ADOPT</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Use existing solution as-is
                </p>
              </button>

              {/* ADAPT */}
              <button
                type="button"
                data-testid="run-kind-adapt"
                onClick={() => setFormData(prev => ({ ...prev, kind: 'ADAPT' }))}
                disabled={isInDemoMode && !isAuthenticated}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  formData.kind === 'ADAPT'
                    ? 'border-yellow-500 bg-yellow-50 dark:border-yellow-400 dark:bg-yellow-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400">
                    ⚡
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">ADAPT</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Modify existing solution
                </p>
              </button>

              {/* BUILD */}
              <button
                type="button"
                data-testid="run-kind-build"
                onClick={() => setFormData(prev => ({ ...prev, kind: 'BUILD' }))}
                disabled={isInDemoMode && !isAuthenticated}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  formData.kind === 'BUILD'
                    ? isBuildBlocked
                      ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                      : 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    🔨
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">BUILD</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create from scratch</p>
              </button>
            </div>

            {/* BUILD blocked message */}
            {isBuildBlocked && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
                <p className="font-medium">Council decision required for BUILD runs</p>
                <p className="mt-1">
                  Submit a Council evaluation with BUILD decision before starting this run.{' '}
                  <Link
                    href={`/council/new?projectId=${formData.projectId}`}
                    className="underline hover:no-underline"
                  >
                    Go to Council →
                  </Link>
                </p>
              </div>
            )}

            {/* Loading council decisions */}
            {loadingCouncil && formData.projectId && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Checking council decisions...
              </p>
            )}
          </div>

          {/* Submit button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              data-testid="run-submit-btn"
              disabled={submitting || (isInDemoMode && !isAuthenticated) || isBuildBlocked}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
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
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                  Start Run
                </>
              )}
            </button>
            <Link
              href="/runs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function NewRunPage() {
  return (
    <Suspense
      fallback={
        <main data-testid="page-root">
          <div className="mb-8">
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              New Run
            </h1>
          </div>
          <div className="animate-pulse">
            <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </main>
      }
    >
      <NewRunContent />
    </Suspense>
  );
}
