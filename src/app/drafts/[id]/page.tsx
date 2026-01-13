'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';

interface DraftEvent {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  eventType: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  detailsJson: Record<string, unknown> | null;
}

interface Draft {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  projectId: string | null;
  runId: string | null;
  kind: 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  title: string;
  payloadJson: Record<string, unknown>;
  sourcesJson: Array<{ type: string; ref: string; title: string; snippet: string }> | null;
  approvedAt: string | null;
  approvedBy: string | null;
  resultRef: string | null;
  events: DraftEvent[];
}

const STATUS_COLORS = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const EVENT_ICONS = {
  CREATED: '✨',
  UPDATED: '📝',
  APPROVED: '✅',
  REJECTED: '❌',
  EXPIRED: '⏰',
};

export default function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/copilot/drafts/${id}`);
      const data = await response.json();
      if (data.draft) {
        setDraft(data.draft);
      } else {
        setError('Draft not found');
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
      setError('Failed to load draft');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const handleApprove = async () => {
    if (!draft) return;
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/copilot/drafts/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (response.ok) {
        await fetchDraft(); // Refresh
      } else {
        setError(data.error || 'Failed to approve draft');
      }
    } catch (err) {
      console.error('Error approving draft:', err);
      setError('Failed to approve draft');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!draft) return;
    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/copilot/drafts/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        await fetchDraft(); // Refresh
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject draft');
      }
    } catch (err) {
      console.error('Error rejecting draft:', err);
      setError('Failed to reject draft');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Draft not found
        </h2>
        <Link href="/drafts" className="text-blue-600 hover:underline">
          Back to Drafts
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="page-root">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/drafts"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Drafts
            </Link>
          </div>
          <h1
            className="text-2xl font-bold text-gray-900 dark:text-white"
            data-testid="page-title"
          >
            {draft.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[draft.status]}`}
            >
              {draft.status}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{draft.kind}</span>
          </div>
        </div>

        {/* Actions */}
        {draft.status === 'DRAFT' && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              data-testid="approve-draft-btn"
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              data-testid="reject-draft-btn"
            >
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payload */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Draft Payload
            </h3>
            <pre
              className="p-4 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto max-h-96"
              data-testid="draft-payload"
            >
              {JSON.stringify(draft.payloadJson, null, 2)}
            </pre>
          </div>

          {/* Sources */}
          {draft.sourcesJson && draft.sourcesJson.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Sources ({draft.sourcesJson.length})
              </h3>
              <div className="space-y-3">
                {draft.sourcesJson.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {source.type === 'DOC' ? '📖' : '🗄️'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {source.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {source.ref}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {source.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="text-sm font-mono text-gray-900 dark:text-white">{draft.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(draft.createdAt).toLocaleString()}
                </dd>
              </div>
              {draft.projectId && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Project</dt>
                  <dd className="text-sm font-mono text-gray-900 dark:text-white">
                    {draft.projectId}
                  </dd>
                </div>
              )}
              {draft.runId && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Run</dt>
                  <dd className="text-sm font-mono text-gray-900 dark:text-white">{draft.runId}</dd>
                </div>
              )}
              {draft.approvedAt && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Approved</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(draft.approvedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {draft.resultRef && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Result</dt>
                  <dd className="text-sm font-mono text-gray-900 dark:text-white">
                    {draft.resultRef}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Events */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Event History
            </h3>
            <div className="space-y-3">
              {draft.events.map(event => (
                <div key={event.id} className="flex items-start gap-2">
                  <span className="text-sm">{EVENT_ICONS[event.eventType]}</span>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{event.eventType}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
