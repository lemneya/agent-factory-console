'use client';

import { useState, useEffect } from 'react';

interface TestStatus {
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  passedCount: number;
  totalCount: number;
}

interface SmokeStatus {
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  message: string;
  updatedAt: string | null;
  tests: {
    'nav-smoke': TestStatus;
    'auth-cta': TestStatus;
    'happy-path': TestStatus;
  };
}

function getStatusBadge(status: 'PASS' | 'FAIL' | 'UNKNOWN'): {
  icon: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'PASS':
      return { icon: '✅', color: 'text-green-700', bg: 'bg-green-100' };
    case 'FAIL':
      return { icon: '❌', color: 'text-red-700', bg: 'bg-red-100' };
    default:
      return { icon: '❓', color: 'text-gray-700', bg: 'bg-gray-100' };
  }
}

export function SmokeStatusCard() {
  const [status, setStatus] = useState<SmokeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/preview/smoke-status');
      if (!response.ok) throw new Error('Failed to fetch smoke status');
      const data = (await response.json()) as SmokeStatus;
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !status) {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        data-testid="smoke-status-card"
      >
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-8 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        data-testid="smoke-status-card"
      >
        <div className="text-sm font-medium text-red-700 dark:text-red-400">
          Failed to load smoke status
        </div>
        <div className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</div>
      </div>
    );
  }

  if (!status) return null;

  const badge = getStatusBadge(status.status);
  const testEntries = Object.entries(status.tests) as [string, TestStatus][];

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      data-testid="smoke-status-card"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Smoke Test Status</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.color}`}>
          {badge.icon} {status.status}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">{status.message}</div>
        <div className="space-y-2">
          {testEntries.map(([name, test]) => {
            const testBadge = getStatusBadge(test.status);
            return (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-2">
                  <span>{testBadge.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {test.passedCount}/{test.totalCount} passed
                </span>
              </div>
            );
          })}
        </div>
        {status.updatedAt && (
          <div className="mt-3 text-xs text-gray-500">
            Last updated: {new Date(status.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
