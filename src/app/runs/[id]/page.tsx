'use client';

import { Suspense } from 'react';
import { useEffect, useState, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CreateTaskModal } from '@/components/tasks';
import { RunTabs, SpecTab, DecisionsTab, CopilotTab, ExecutionTab } from '@/components/runs';
import { useRunTabs } from '@/hooks/useRunTabs';

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  hitlJson?: unknown;
}

interface Run {
  id: string;
  name: string;
  status: string;
  ralphMode: boolean;
  createdAt: string;
  project: {
    id: string;
    repoName: string;
    repoFullName: string;
    htmlUrl: string;
  };
  tasks: Task[];
}

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

// Wrap component with Suspense for useSearchParams
function RunDetailPageContent({ id }: { id: string }) {
  const { status: authStatus } = useSession();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Determine if spec is present (check hitlJson for spec_md or similar)
  const specPresent = run?.tasks.some((t) => {
    if (!t.hitlJson || typeof t.hitlJson !== 'object') return false;
    const hitl = t.hitlJson as { docs?: { spec_md?: string } };
    return Boolean(hitl.docs?.spec_md);
  }) ?? false;

  // Get spec markdown from first task that has it
  const specMarkdown = run?.tasks.reduce((found, t) => {
    if (found) return found;
    if (!t.hitlJson || typeof t.hitlJson !== 'object') return null;
    const hitl = t.hitlJson as { docs?: { spec_md?: string } };
    return hitl.docs?.spec_md ?? null;
  }, null as string | null);

  // Use the tabs hook
  const { tab, setTab, hasBlockedTasks } = useRunTabs({
    runId: id,
    tasks: run?.tasks ?? [],
    specPresent,
  });

  const fetchRun = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/runs/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Run not found');
        }
        throw new Error('Failed to fetch run');
      }
      const data = await res.json();
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchRun();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchRun]);

  async function handleMoveTask(taskId: string, newStatus: string) {
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update task');
      }

      await fetchRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      await fetchRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/runs"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Runs
          </Link>
          <div className="mt-2 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-6 h-64 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/runs"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Runs
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Run Details</h1>
        </div>
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
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Sign in required
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in with GitHub to view run details.
          </p>
        </div>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/runs"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Runs
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Run Details</h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/50">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/runs"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Runs
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{run?.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span>{run?.project.repoFullName}</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                run?.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                  : run?.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
              }`}
            >
              {run?.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          Add Task
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* AFC-COPILOT-UX-2: Tabbed Layout */}
      <div className="mb-6">
        <RunTabs activeTab={tab} onTabChange={setTab} hasBlockedTasks={hasBlockedTasks} />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tab === 'spec' && <SpecTab runId={id} specMarkdown={specMarkdown} />}
        {tab === 'decisions' && run && (
          <DecisionsTab
            runId={run.id}
            onTaskUnblocked={fetchRun}
            hasBlockedTasks={hasBlockedTasks}
          />
        )}
        {tab === 'copilot' && run && <CopilotTab runId={run.id} projectId={run.project.id} />}
        {tab === 'execution' && run && (
          <ExecutionTab
            run={run}
            tasks={run.tasks}
            onMoveTask={handleMoveTask}
            onDeleteTask={handleDeleteTask}
            onRefresh={fetchRun}
          />
        )}
      </div>

      {/* AFC-UX-1: Zenflow-style Create Task Modal */}
      {showModal && (
        <CreateTaskModal
          runId={id}
          onClose={() => setShowModal(false)}
          onSuccess={fetchRun}
        />
      )}
    </div>
  );
}

export default function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div>
          <div className="mb-8">
            <Link
              href="/runs"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to Runs
            </Link>
            <div className="mt-2 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-6 h-64 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      }
    >
      <RunDetailPageContent id={id} />
    </Suspense>
  );
}

