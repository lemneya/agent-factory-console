'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

interface Run {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  _count: {
    tasks: number;
  };
}

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
  description: string | null;
  htmlUrl: string;
  lastUpdated: string;
  runs: Run[];
  _count: {
    runs: number;
    events: number;
    councilDecisions: number;
  };
}

function ProjectDetailContent() {
  const { status } = useSession();
  const { isDemoMode } = useDemoMode();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = status === 'authenticated';
  const canViewData = isAuthenticated || isInDemoMode;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project');
      }
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (canViewData) {
      fetchProject();
    } else if (status === 'unauthenticated' && !isInDemoMode) {
      setLoading(false);
    }
  }, [status, canViewData, isInDemoMode, fetchProject]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusColor(runStatus: string) {
    switch (runStatus) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'RUNNING':
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Loading...
          </h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
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
            href="/projects"
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
            Back to Projects
          </Link>
          <h1
            data-testid="page-title"
            className="mt-4 text-2xl font-bold text-gray-900 dark:text-white"
          >
            Project Details
          </h1>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to view project details."
        />
      </main>
    );
  }

  if (error) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <Link
            href="/projects"
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
            Back to Projects
          </Link>
          <h1
            data-testid="page-title"
            className="mt-4 text-2xl font-bold text-gray-900 dark:text-white"
          >
            Error
          </h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <main data-testid="page-root">
      {/* Demo mode badge */}
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
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
          Back to Projects
        </Link>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {project.repoName}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{project.repoFullName}</p>
          </div>
          <div className="flex items-center gap-3">
            {project.htmlUrl && (
              <a
                href={project.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            )}
            <Link
              href={`/runs/new?projectId=${project.id}`}
              data-testid="project-start-run"
              className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${
                isInDemoMode && !isAuthenticated ? 'cursor-not-allowed opacity-50' : ''
              }`}
              onClick={e => {
                if (isInDemoMode && !isAuthenticated) {
                  e.preventDefault();
                }
              }}
            >
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
            </Link>
          </div>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {project.description && (
          <p className="mb-4 text-gray-600 dark:text-gray-400">{project.description}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {project._count.runs}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Events</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {project._count.events}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Council Decisions</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {project._count.councilDecisions}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDate(project.lastUpdated)}
        </p>
      </div>

      {/* Recent Runs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Runs</h2>
          <Link
            href={`/runs?projectId=${project.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all runs →
          </Link>
        </div>

        {project.runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-600 dark:bg-gray-800">
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
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No runs yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start your first run to begin agent workflows.
            </p>
            <Link
              href={`/runs/new?projectId=${project.id}`}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${
                isInDemoMode && !isAuthenticated ? 'cursor-not-allowed opacity-50' : ''
              }`}
              onClick={e => {
                if (isInDemoMode && !isAuthenticated) {
                  e.preventDefault();
                }
              }}
            >
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
              Start First Run
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {project.runs.map(run => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{run.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {run._count.tasks} tasks • Started {formatDate(run.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(run.status)}`}
                  >
                    {run.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <main data-testid="page-root">
          <div className="mb-8">
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Loading...
            </h1>
          </div>
          <div className="animate-pulse">
            <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </main>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
