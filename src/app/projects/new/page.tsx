'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';

function NewProjectContent() {
  const { data: session, status } = useSession();
  const { isDemoMode } = useDemoMode();
  const router = useRouter();
  const searchParams = useSearchParams();

  const demoParam = searchParams.get('demo');
  const isInDemoMode = isDemoMode || demoParam === '1';
  const isAuthenticated = status === 'authenticated';

  const [formData, setFormData] = useState({
    name: '',
    repoFullName: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isInDemoMode && !isAuthenticated) {
      setError('Sign in required to create projects');
      return;
    }

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          repoFullName: formData.repoFullName.trim() || undefined,
          description: formData.description.trim() || undefined,
          userId: session?.user?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            New Project
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
            New Project
          </h1>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to create a new project."
        />
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      {/* Demo mode badge */}
      {isInDemoMode && !isAuthenticated && <DemoModeBadge />}

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
          New Project
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Create a new project to start running agent workflows
        </p>
      </div>

      {isInDemoMode && !isAuthenticated && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
          <p className="font-medium">Read-only demo mode</p>
          <p className="mt-1 text-sm">Sign in to create projects.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="space-y-6">
          {/* Name field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              data-testid="project-name-input"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isInDemoMode && !isAuthenticated}
              placeholder="my-awesome-project"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A unique name for your project
            </p>
          </div>

          {/* Repo Full Name field */}
          <div>
            <label
              htmlFor="repoFullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              GitHub Repository (optional)
            </label>
            <input
              type="text"
              id="repoFullName"
              data-testid="project-repo-input"
              value={formData.repoFullName}
              onChange={e => setFormData(prev => ({ ...prev, repoFullName: e.target.value }))}
              disabled={isInDemoMode && !isAuthenticated}
              placeholder="owner/repo"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Link to an existing GitHub repository (e.g., octocat/hello-world)
            </p>
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              data-testid="project-description-input"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isInDemoMode && !isAuthenticated}
              rows={3}
              placeholder="A brief description of your project..."
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Submit button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              data-testid="project-submit-btn"
              disabled={submitting || (isInDemoMode && !isAuthenticated)}
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
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
            <Link
              href="/projects"
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

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <main data-testid="page-root">
          <div className="mb-8">
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              New Project
            </h1>
          </div>
          <div className="animate-pulse">
            <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </main>
      }
    >
      <NewProjectContent />
    </Suspense>
  );
}
