'use client';

/**
 * AFC-UX-1: Zenflow-style New Task Modal
 *
 * Features:
 * - Mode picker: Quick change / Fix bug / Spec and build / Full SDD workflow
 * - Task title (required)
 * - Optional description textarea
 * - Optional assignee
 * - Toggle: Auto-start next steps on success
 * - Buttons: Cancel | Create | Create & Run
 */

import { useState } from 'react';

// Mode configuration for the picker
const TASK_MODES = [
  {
    id: 'QUICK_CHANGE',
    label: 'Quick change',
    description: 'Small, focused modification',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    id: 'FIX_BUG',
    label: 'Fix bug',
    description: 'Debug and resolve an issue',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0112 3.75c1.498 0 2.797.88 3.402 2.145m0 0a6.032 6.032 0 011.155-1.002 4.49 4.49 0 00-.574-1.748" />
      </svg>
    ),
    color: 'red',
  },
  {
    id: 'SPEC_BUILD',
    label: 'Spec and build',
    description: 'Design then implement',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'purple',
  },
  {
    id: 'FULL_SDD',
    label: 'Full SDD workflow',
    description: 'Complete structured delivery',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: 'green',
  },
];

const MODE_COLORS: Record<string, { bg: string; border: string; text: string; selectedBg: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    selectedBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    selectedBg: 'bg-red-100 dark:bg-red-900/40',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    selectedBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    selectedBg: 'bg-green-100 dark:bg-green-900/40',
  },
};

interface Worker {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface CreateTaskModalProps {
  runId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({ runId, onClose, onSuccess }: CreateTaskModalProps) {
  const [selectedMode, setSelectedMode] = useState<string>('QUICK_CHANGE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingAndRunning, setIsCreatingAndRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function createTask(): Promise<{ id: string } | null> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        title,
        description: description || null,
        assignee: assignee || null,
        kind: selectedMode,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create task');
    }

    return res.json();
  }

  async function findIdleWorkerAndClaim(): Promise<{ claimed: boolean; message: string }> {
    // Get workers
    const workersRes = await fetch('/api/workers');
    if (!workersRes.ok) {
      return { claimed: false, message: 'Failed to fetch workers' };
    }

    const { workers } = await workersRes.json() as { workers: Worker[] };

    if (!workers || workers.length === 0) {
      return { claimed: false, message: 'No workers registered; task queued' };
    }

    // Find an IDLE worker
    const idleWorker = workers.find((w: Worker) => w.status === 'IDLE');
    if (!idleWorker) {
      return { claimed: false, message: 'No idle workers available; task queued' };
    }

    // Try to claim
    const claimRes = await fetch(`/api/workers/${idleWorker.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }),
    });

    if (!claimRes.ok) {
      const claimData = await claimRes.json();
      return { claimed: false, message: claimData.error || 'Failed to claim task' };
    }

    const claimData = await claimRes.json();
    if (claimData.task) {
      return { claimed: true, message: `Task claimed by worker: ${idleWorker.name}` };
    } else {
      return { claimed: false, message: claimData.message || 'No tasks available for claim' };
    }
  }

  async function handleCreate() {
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      await createTask();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateAndRun() {
    if (!title.trim()) return;

    try {
      setIsCreatingAndRunning(true);
      setError(null);
      setSuccessMessage(null);

      // Create the task first
      await createTask();

      // Try to find an idle worker and claim
      const result = await findIdleWorkerAndClaim();

      if (result.claimed) {
        setSuccessMessage(result.message);
        // Brief delay to show success message
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        // Task created but not claimed - still success, just with warning
        setSuccessMessage(`Task created. ${result.message}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsCreatingAndRunning(false);
    }
  }

  const isSubmitting = isCreating || isCreatingAndRunning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Task</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a workflow mode and describe what needs to be done
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Mode Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Workflow Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TASK_MODES.map((mode) => {
                const colors = MODE_COLORS[mode.color];
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? `${colors.selectedBg} ${colors.border} ring-2 ring-offset-2 ring-${mode.color}-500`
                        : `${colors.bg} border-transparent hover:${colors.border}`
                    }`}
                  >
                    <div className={`mb-2 ${colors.text}`}>
                      {mode.icon}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? colors.text : 'text-gray-900 dark:text-white'}`}>
                      {mode.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {mode.description}
                    </span>
                    {isSelected && (
                      <div className={`absolute top-2 right-2 ${colors.text}`}>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Add user authentication flow"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about what needs to be done..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assignee <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="@username"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Auto-start Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Auto-start next steps
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically continue workflow on success
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoStartNext(!autoStartNext)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoStartNext ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              disabled={isSubmitting}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoStartNext ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
              {successMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={handleCreateAndRun}
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreatingAndRunning ? 'Starting...' : 'Create & Run'}
          </button>
        </div>
      </div>
    </div>
  );
}
