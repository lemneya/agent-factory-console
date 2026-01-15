'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RouteHealthGrid, SmokeStatusCard } from '@/components/preview';
import { usePreviewPresets } from '@/components/preview/usePreviewPresets';
import { PresetEditorModal } from '@/components/preview/PresetEditorModal';

function PreviewContent() {
  const searchParams = useSearchParams();
  const [iframeKey, setIframeKey] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const {
    presets,
    activePreset,
    activePresetId,
    currentPath,
    getPreviewUrl,
    selectPreset,
    setPath,
    savePresets,
  } = usePreviewPresets();

  // Handle URL query params for deep linking (runs after initial render)
  useEffect(() => {
    const pathParam = searchParams.get('path');
    const presetParam = searchParams.get('preset');

    if (presetParam) {
      const preset = presets.find(p => p.id === presetParam);
      if (preset) {
        selectPreset(presetParam);
      }
    }

    if (pathParam) {
      setPath(pathParam);
    }
  }, [searchParams, presets, selectPreset, setPath]);

  const handleRouteSelect = useCallback(
    (path: string) => {
      setPath(path);
      setIframeKey(prev => prev + 1); // Force iframe reload
    },
    [setPath]
  );

  const handleRefresh = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      selectPreset(e.target.value);
      setIframeKey(prev => prev + 1); // Force iframe reload on preset change
    },
    [selectPreset]
  );

  const handleOpenCurrent = useCallback(() => {
    const url = getPreviewUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [getPreviewUrl]);

  const fullUrl = getPreviewUrl();
  const isConfigured = activePreset && activePreset.url;

  // Always render the full page shell immediately - no initialization gate
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
          {/* Preset Dropdown */}
          <select
            value={activePresetId}
            onChange={handlePresetChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            data-testid="preview-preset-select"
          >
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
                {preset.url
                  ? ` (${preset.url.slice(0, 30)}${preset.url.length > 30 ? '...' : ''})`
                  : ' (not set)'}
              </option>
            ))}
          </select>

          {/* Edit Presets Button */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            data-testid="preset-editor-open"
          >
            Edit Presets
          </button>

          {/* Open Current Button */}
          <button
            onClick={handleOpenCurrent}
            disabled={!fullUrl}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            data-testid="preview-open-current"
          >
            Open Current ↗
          </button>

          {/* Reload Button */}
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="preview-reload"
          >
            Reload
          </button>
        </div>
      </div>

      {/* Current Path Display */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Current:</span>
        <span
          className="font-mono text-sm text-gray-700 dark:text-gray-300"
          data-testid="preview-current-path"
        >
          {currentPath}
        </span>
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
                  No Preview URL Set
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Select a preset with a URL or click &quot;Edit Presets&quot; to configure one.
                </p>
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit Presets
                </button>
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
                    loading="lazy"
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

      {/* Preset Editor Modal */}
      <PresetEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        presets={presets}
        onSave={savePresets}
      />
    </div>
  );
}

function LoadingFallback() {
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
      </div>
      {/* Loading content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PreviewContent />
    </Suspense>
  );
}
