'use client';

import { useState, useEffect, useCallback } from 'react';

interface RunPolicy {
  maxIterations: number;
  maxWallClockSeconds: number;
  maxFailures: number;
  maxRepeatedError: number;
  maxNoProgressIterations: number;
  verificationCommands: string[];
  completionPromise: string;
}

interface Iteration {
  id: string;
  iteration: number;
  status: 'RUNNING' | 'PASSED' | 'FAILED' | 'WAITING_FOR_APPROVAL' | 'ABORTED';
  startedAt: string;
  endedAt: string | null;
  errorFingerprint: string | null;
  verificationSummary: unknown;
}

interface RalphModePanelProps {
  runId: string;
  ralphMode: boolean;
  runStatus: string;
  onRefresh?: () => void;
}

export default function RalphModePanel({
  runId,
  ralphMode: initialRalphMode,
  runStatus,
  onRefresh,
}: RalphModePanelProps) {
  const [ralphMode, setRalphMode] = useState(initialRalphMode);
  const [policy, setPolicy] = useState<RunPolicy | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [policyRes, iterationsRes] = await Promise.all([
        fetch(`/api/runs/${runId}/policy`),
        fetch(`/api/runs/${runId}/iterations`),
      ]);

      if (policyRes.ok) {
        const policyData = await policyRes.json();
        setPolicy(policyData.policy);
      }

      if (iterationsRes.ok) {
        const iterData = await iterationsRes.json();
        setIterations(iterData.iterations || []);
      }
    } catch (err) {
      console.error('Error fetching Ralph data:', err);
    }
  }, [runId]);

  useEffect(() => {
    fetchData();
    // Poll for updates when in Ralph mode
    if (ralphMode) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [ralphMode, fetchData]);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/ralph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start Ralph Mode');
      }
      setRalphMode(true);
      fetchData();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    if (!confirm('Are you sure you want to stop Ralph Mode?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/ralph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to stop Ralph Mode');
      }
      setRalphMode(false);
      fetchData();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/ralph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }
      fetchData();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'PASSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'WAITING_FOR_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'ABORTED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasWaitingIteration = iterations.some(i => i.status === 'WAITING_FOR_APPROVAL');
  const isRunComplete = runStatus === 'COMPLETED' || runStatus === 'FAILED';

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-800">
            <svg
              className="h-5 w-5 text-purple-600 dark:text-purple-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">Ralph Mode</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {ralphMode ? 'Autonomous loop active' : 'Disabled'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ralphMode
                ? 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {ralphMode ? 'ACTIVE' : 'OFF'}
          </span>
          <svg
            className={`h-5 w-5 text-purple-600 transition-transform dark:text-purple-400 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-purple-200 p-4 dark:border-purple-800">
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="mb-4 flex gap-2">
            {!ralphMode && !isRunComplete && (
              <button
                onClick={handleStart}
                disabled={loading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Ralph Mode'}
              </button>
            )}
            {ralphMode && (
              <>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Stopping...' : 'Abort Run'}
                </button>
                {hasWaitingIteration && (
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Approving...' : 'Approve & Resume'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Policy Summary */}
          {policy && (
            <div className="mb-4 rounded-lg bg-white p-3 dark:bg-gray-800">
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Policy</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>Max Iterations: {policy.maxIterations}</div>
                <div>Max Time: {Math.round(policy.maxWallClockSeconds / 3600)}h</div>
                <div>Max Failures: {policy.maxFailures}</div>
                <div>Thrash Limit: {policy.maxRepeatedError}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Verification: {(policy.verificationCommands as string[]).join(' → ')}
              </div>
            </div>
          )}

          {/* Iteration Timeline */}
          {iterations.length > 0 && (
            <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Iteration Timeline ({iterations.length} total)
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {iterations.map(iter => (
                  <div
                    key={iter.id}
                    className="flex items-center justify-between rounded border border-gray-200 p-2 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        #{iter.iteration}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(iter.status)}`}
                      >
                        {iter.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {iter.errorFingerprint && (
                        <span className="font-mono" title="Error fingerprint">
                          🔴 {iter.errorFingerprint}
                        </span>
                      )}
                      {iter.endedAt && (
                        <span>
                          {Math.round(
                            (new Date(iter.endedAt).getTime() -
                              new Date(iter.startedAt).getTime()) /
                              1000
                          )}
                          s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!ralphMode && iterations.length === 0 && (
            <div className="text-center text-sm text-purple-600 dark:text-purple-400">
              Enable Ralph Mode to start autonomous verification loops
            </div>
          )}
        </div>
      )}
    </div>
  );
}
