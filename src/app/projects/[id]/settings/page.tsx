'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SignedOutCTA, DemoModeBadge, useDemoMode } from '@/components/auth';
import { ArrowLeft, Save, Settings } from 'lucide-react';

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
  description: string | null;
  htmlUrl: string;
  repoOwner: string | null;
  baseBranch: string | null;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const { status: authStatus } = useSession();
  const { isDemoMode } = useDemoMode();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');

  // Fetch project details
  const fetchProject = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);

      // Initialize form with existing values
      setRepoOwner(data.repoOwner || '');
      setRepoName(data.repoName || data.repoName || '');
      setBaseBranch(data.baseBranch || 'main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === 'authenticated' || isDemoMode) {
      fetchProject();
    }
  }, [authStatus, isDemoMode, fetchProject]);

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoOwner,
          repoName,
          baseBranch: baseBranch || 'main',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project settings');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (authStatus === 'loading' || (isLoading && !project)) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <Link
            href={`/projects/${id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Project Settings
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
            Project Settings
          </h1>
        </div>
        <SignedOutCTA
          title="Sign in required"
          reason="Sign in with GitHub to manage project settings."
        />
      </div>
    );
  }

  // Error state
  if (error && !project) {
    return (
      <div data-testid="page-root">
        <div className="mb-8">
          <Link
            href={`/projects/${id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Project Settings
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link
            href={`/projects/${id}`}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div data-testid="page-root">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-bold text-gray-900 dark:text-white"
                data-testid="page-title"
              >
                Project Settings
              </h1>
              {isDemoMode && <DemoModeBadge />}
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Configure repository binding for {project.repoFullName}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Settings className="h-5 w-5" />
            Repository Binding
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure the target repository for blueprint execution. These settings will be used
            automatically when executing work orders.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Repository Owner */}
          <div>
            <label
              htmlFor="repoOwner"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Repository Owner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="repoOwner"
              value={repoOwner}
              onChange={e => setRepoOwner(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., lemneya"
              required
              data-testid="project-repo-owner"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The GitHub username or organization that owns the repository
            </p>
          </div>

          {/* Repository Name */}
          <div>
            <label
              htmlFor="repoName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Repository Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="repoName"
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., agent-factory-console"
              required
              data-testid="project-repo-name"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The name of the repository (without owner prefix)
            </p>
          </div>

          {/* Base Branch */}
          <div>
            <label
              htmlFor="baseBranch"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Base Branch
            </label>
            <input
              type="text"
              id="baseBranch"
              value={baseBranch}
              onChange={e => setBaseBranch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="main"
              data-testid="project-repo-branch"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The default branch to target for PRs (defaults to &quot;main&quot;)
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success message */}
          {saveSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-600 dark:text-green-400">
              Settings saved successfully!
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSaving || !repoOwner || !repoName}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="project-repo-save"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
