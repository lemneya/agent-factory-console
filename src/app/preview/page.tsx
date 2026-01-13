'use client';

import { useState, useCallback, useMemo } from 'react';
import { RouteHealthGrid, SmokeStatusCard } from '@/components/preview';

export default function PreviewPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [iframeKey, setIframeKey] = useState(0);

  // Get preview URL from environment at render time (not in effect)
  const previewUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_PREVIEW_URL || null;
  }, []);

  const isConfigured = previewUrl !== null;

  const handleRouteSelect = useCallback((path: string) => {
    setCurrentPath(path);
    setIframeKey(prev => prev + 1); // Force iframe reload
  }, []);

  const handleRefresh = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  const fullUrl = previewUrl ? `${previewUrl.replace(/\/$/, '')}${currentPath}` : null;

  return (
    <div className="flex h-full flex-col" data-testid="page-root">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h1
            className="text-xl font-semibold text-gray-900 dark:text-white"
            data-testid="page-title"
          >
            Preview
          </h1>
          <p className="mt-1 text-sm text-gray-500">Live app preview and route health monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {fullUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Open in New Tab ↗
            </a>
          )}
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh Preview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Preview iframe */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700">
          {!isConfigured ? (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-800">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview Not Configured
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Set{' '}
                  <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">
                    NEXT_PUBLIC_PREVIEW_URL
                  </code>{' '}
                  in your environment to enable the preview panel.
                </p>
                <div className="mt-4 rounded-lg bg-gray-100 p-3 text-left dark:bg-gray-700">
                  <code className="text-xs text-gray-700 dark:text-gray-300">
                    NEXT_PUBLIC_PREVIEW_URL=http://localhost:3000
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* URL Bar */}
              <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {fullUrl || 'No URL configured'}
                </div>
              </div>
              {/* iframe */}
              <div className="flex-1 bg-white">
                {fullUrl && (
                  <iframe
                    key={iframeKey}
                    src={fullUrl}
                    className="h-full w-full border-0"
                    title="Preview"
                    data-testid="preview-iframe"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Health Grid and Smoke Status */}
        <div className="w-80 flex-shrink-0 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="space-y-4">
            <RouteHealthGrid onRouteSelect={handleRouteSelect} />
            <SmokeStatusCard />
          </div>
        </div>
      </div>
    </div>
  );
}
