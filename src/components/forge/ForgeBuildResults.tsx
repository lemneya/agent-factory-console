'use client';

import type { DecomposedSpec } from '@/lib/forge';

interface ParallelizationStats {
  totalWorkstreams: number;
  totalWaves: number;
  maxParallelAgents: number;
  estimatedSequentialMinutes: number;
  estimatedParallelMinutes: number;
  speedupFactor: number;
}

interface ForgeBuildResultsProps {
  decomposition: DecomposedSpec | null;
  stats: ParallelizationStats | null;
  buildStatus: 'idle' | 'planning' | 'executing' | 'merging' | 'testing' | 'complete' | 'failed';
  prUrl?: string;
}

export default function ForgeBuildResults({
  decomposition,
  stats,
  buildStatus,
  prUrl,
}: ForgeBuildResultsProps) {
  if (!decomposition) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Build Plan
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No build plan yet</p>
          <p className="text-xs mt-1">Enter a spec and preview to see the execution plan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Build Plan
        </h3>
        <BuildStatusBadge status={buildStatus} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalWorkstreams}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Workstreams</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalWaves}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Waves</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.speedupFactor.toFixed(1)}x
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Speedup</p>
          </div>
        </div>
      )}

      {/* Time comparison */}
      {stats && (
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sequential: </span>
              <span className="text-gray-400 line-through">
                {stats.estimatedSequentialMinutes} min
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Parallel: </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ~{stats.estimatedParallelMinutes} min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Execution waves visualization */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Execution Waves
        </h4>
        <div className="space-y-3">
          {decomposition.executionWaves.map((wave, waveIdx) => (
            <div key={waveIdx} className="flex items-center gap-3">
              <div className="shrink-0 w-16 text-xs font-medium text-gray-500 dark:text-gray-400">
                Wave {waveIdx + 1}
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {wave.map((workstreamId) => {
                  const workstream = decomposition.workstreams.find(
                    (w) => w.id === workstreamId
                  );
                  return (
                    <span
                      key={workstreamId}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      title={workstream?.prompt}
                    >
                      {workstream?.name || workstreamId}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workstreams detail */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Workstream Details
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {decomposition.workstreams.map((ws) => (
            <details
              key={ws.id}
              className="group rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {ws.name}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {ws.agent}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ~{ws.estimatedMinutes}m
                </span>
              </summary>
              <div className="px-3 pb-3 text-xs text-gray-600 dark:text-gray-400">
                <p className="mb-2">{ws.prompt}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="font-medium">Owns:</span>
                  {ws.owns.map((path) => (
                    <code
                      key={path}
                      className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      {path}
                    </code>
                  ))}
                </div>
                {ws.blockedBy.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Depends on:</span>{' '}
                    {ws.blockedBy.join(', ')}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Integration points */}
      {decomposition.integrationPoints.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Integration Points
          </h4>
          <div className="space-y-2">
            {decomposition.integrationPoints.map((ip, idx) => (
              <div
                key={`${ip.from}-${ip.to}-${idx}`}
                className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-orange-700 dark:text-orange-300">
                    Integration
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {ip.from} → {ip.to}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{ip.contract}</p>
                {ip.files.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ip.files.map((file) => (
                      <code
                        key={file}
                        className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900/40 rounded"
                      >
                        {file}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PR Link */}
      {prUrl && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            Build Complete!
          </p>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            View Pull Request
          </a>
        </div>
      )}
    </div>
  );
}

function BuildStatusBadge({ status }: { status: ForgeBuildResultsProps['buildStatus'] }) {
  const configs: Record<
    ForgeBuildResultsProps['buildStatus'],
    { label: string; className: string }
  > = {
    idle: {
      label: 'Ready',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
    planning: {
      label: 'Planning',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    executing: {
      label: 'Executing',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    merging: {
      label: 'Merging',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    },
    testing: {
      label: 'Testing',
      className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    },
    complete: {
      label: 'Complete',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    },
  };

  const config = configs[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
