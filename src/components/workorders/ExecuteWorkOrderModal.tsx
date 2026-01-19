'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ExecuteWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderIds: string[];
  workOrderTitles?: string[];
}

export function ExecuteWorkOrderModal({
  isOpen,
  onClose,
  workOrderIds,
  workOrderTitles = [],
}: ExecuteWorkOrderModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [owner, setOwner] = useState('lemneya');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/runner/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRepoOwner: owner,
          targetRepoName: repo,
          targetBranch: branch,
          workOrderIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute work orders');
      }

      // Navigate to the execution detail page, preserving demo mode if active
      const demoParam = searchParams.get('demo');
      const url =
        demoParam === '1'
          ? `/executions/${data.executionRunId}?demo=1`
          : `/executions/${data.executionRunId}`;
      router.push(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setOwner('lemneya');
    setRepo('');
    setBranch('main');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800"
        data-testid="runner-exec-modal"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Execute WorkOrder{workOrderIds.length > 1 ? 's' : ''}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* WorkOrders being executed */}
            {workOrderTitles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WorkOrders to Execute
                </label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {workOrderTitles.map((title, idx) => (
                      <li key={workOrderIds[idx]} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Repository Owner */}
            <div>
              <label
                htmlFor="owner"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Repository Owner
              </label>
              <input
                type="text"
                id="owner"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="lemneya"
                required
                data-testid="runner-owner"
              />
            </div>

            {/* Repository Name */}
            <div>
              <label
                htmlFor="repo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Repository Name
              </label>
              <input
                type="text"
                id="repo"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="my-project"
                required
                data-testid="runner-repo"
              />
            </div>

            {/* Base Branch */}
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Base Branch
              </label>
              <input
                type="text"
                id="branch"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="main"
                required
                data-testid="runner-branch"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !owner || !repo}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="runner-submit"
            >
              {isSubmitting ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
