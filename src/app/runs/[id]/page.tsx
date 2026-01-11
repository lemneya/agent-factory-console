'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Run {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    repoName: string;
    repoFullName: string;
    htmlUrl: string;
  };
  tasks: Task[];
}

const COLUMNS = [
  {
    id: 'TODO',
    label: 'TODO',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    badgeBg: 'bg-gray-200 dark:bg-gray-700',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  {
    id: 'DOING',
    label: 'DOING',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-200 dark:bg-blue-800',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  {
    id: 'BLOCKED',
    label: 'BLOCKED',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    badgeBg: 'bg-red-200 dark:bg-red-800',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  {
    id: 'DONE',
    label: 'DONE',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    badgeBg: 'bg-green-200 dark:bg-green-800',
    borderColor: 'border-green-300 dark:border-green-700',
  },
];

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = use(params);
  const { status: authStatus } = useSession();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: '' });

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

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      setCreating(true);
      setError(null);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: id,
          title: newTask.title,
          assignee: newTask.assignee || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create task');
      }

      setShowModal(false);
      setNewTask({ title: '', assignee: '' });
      await fetchRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

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

  function getTasksByStatus(status: string): Task[] {
    return run?.tasks.filter(task => task.status === status) || [];
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
        <div className="grid gap-6 md:grid-cols-4">
          {COLUMNS.map(col => (
            <div key={col.id} className={`rounded-xl p-4 ${col.bgColor}`}>
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-4 space-y-2">
                <div className="h-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
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
      <div className="mb-8 flex items-start justify-between">
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

      <div className="grid gap-6 md:grid-cols-4">
        {COLUMNS.map(column => {
          const tasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className={`rounded-xl p-4 ${column.bgColor}`}>
              <h2 className={`mb-4 flex items-center font-semibold ${column.textColor}`}>
                {column.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${column.badgeBg}`}>
                  {tasks.length}
                </span>
              </h2>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed p-4 text-center text-sm ${column.borderColor} ${column.textColor} opacity-60`}
                  >
                    No tasks
                  </div>
                ) : (
                  tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentStatus={column.id}
                      onMove={handleMoveTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Task</h2>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Implement user authentication"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assignee (optional)
                </label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="e.g., @username"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewTask({ title: '', assignee: '' });
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTask.title}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  currentStatus: string;
  onMove: (taskId: string, newStatus: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, currentStatus, onMove, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const availableMoves = COLUMNS.filter(col => col.id !== currentStatus);

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h3>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-600 dark:hover:text-gray-300"
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
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Move to
              </div>
              {availableMoves.map(col => (
                <button
                  key={col.id}
                  onClick={() => {
                    onMove(task.id, col.id);
                    setShowMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {col.label}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          {task.assignee}
        </div>
      )}
    </div>
  );
}
