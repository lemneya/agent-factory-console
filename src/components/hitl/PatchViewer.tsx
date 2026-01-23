'use client';

import { useState } from 'react';

export interface HITLPatch {
  id: string;
  filename: string;
  diff: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt?: string;
  reviewedBy?: string;
}

interface PatchViewerProps {
  patch: HITLPatch;
  onPatchAction: (patchId: string, action: 'approve' | 'reject') => Promise<void>;
  disabled?: boolean;
}

export default function PatchViewer({
  patch,
  onPatchAction,
  disabled = false,
}: PatchViewerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const isReviewed = patch.status !== 'pending';

  async function handleAction(action: 'approve' | 'reject') {
    if (disabled || isSubmitting || isReviewed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onPatchAction(patch.id, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process patch');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Parse diff for syntax highlighting
  const diffLines = patch.diff.split('\n');

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        patch.status === 'approved'
          ? 'border-green-200 dark:border-green-800'
          : patch.status === 'rejected'
            ? 'border-red-200 dark:border-red-800'
            : 'border-blue-200 dark:border-blue-800'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${
          patch.status === 'approved'
            ? 'bg-green-50 dark:bg-green-900/20'
            : patch.status === 'rejected'
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'bg-blue-50 dark:bg-blue-900/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {patch.filename}
            </span>
          </div>
          {patch.status !== 'pending' && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                patch.status === 'approved'
                  ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                  : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
              }`}
            >
              {patch.status === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          )}
        </div>
        {!isReviewed && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('approve')}
              disabled={disabled || isSubmitting}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={disabled || isSubmitting}
              className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {patch.description && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">{patch.description}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Diff content */}
      {expanded && (
        <div className="overflow-x-auto bg-gray-900">
          <pre className="p-4 text-xs leading-relaxed">
            {diffLines.map((line, idx) => {
              let className = 'text-gray-300';
              if (line.startsWith('+') && !line.startsWith('+++')) {
                className = 'bg-green-900/40 text-green-300';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                className = 'bg-red-900/40 text-red-300';
              } else if (line.startsWith('@@')) {
                className = 'text-blue-400';
              } else if (line.startsWith('diff') || line.startsWith('index')) {
                className = 'text-gray-500';
              }

              return (
                <div key={idx} className={className}>
                  {line || ' '}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* Footer for reviewed patches */}
      {isReviewed && patch.appliedAt && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {patch.status === 'approved' ? 'Approved' : 'Rejected'}{' '}
            {patch.reviewedBy && `by ${patch.reviewedBy}`} on{' '}
            {new Date(patch.appliedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
