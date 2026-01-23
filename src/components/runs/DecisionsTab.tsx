'use client';

import { CopilotHITLPanel } from '@/components/hitl';

interface DecisionsTabProps {
  runId: string;
  onTaskUnblocked: () => void;
  hasBlockedTasks: boolean;
}

export default function DecisionsTab({ runId, onTaskUnblocked, hasBlockedTasks }: DecisionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Decisions & Governance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Human-in-the-loop approvals, questions, and patch reviews
            </p>
          </div>
        </div>
      </div>

      {/* HITL Panel */}
      <CopilotHITLPanel runId={runId} onTaskUnblocked={onTaskUnblocked} />

      {/* Empty state when no blocked tasks */}
      {!hasBlockedTasks && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <svg
            className="mx-auto h-12 w-12 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No pending decisions
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            All tasks are proceeding without requiring human input.
          </p>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
            When agents need clarification or approval, items will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
