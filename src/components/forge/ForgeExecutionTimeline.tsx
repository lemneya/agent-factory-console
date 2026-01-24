'use client';

import { useEffect, useState } from 'react';

export type BuildPhase =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'cloning'
  | 'executing'
  | 'merging'
  | 'testing'
  | 'complete'
  | 'failed';

interface ForgeExecutionTimelineProps {
  currentPhase: BuildPhase;
  currentWave?: number;
  totalWaves?: number;
  startTime?: Date;
  completedAgents?: number;
  totalAgents?: number;
}

const PHASES: { id: BuildPhase; label: string; icon: string; description: string }[] = [
  { id: 'analyzing', label: 'Analyze', icon: '🔍', description: 'Understanding requirements' },
  { id: 'planning', label: 'Plan', icon: '📋', description: 'Decomposing into workstreams' },
  { id: 'cloning', label: 'Clone', icon: '📦', description: 'Setting up from template' },
  { id: 'executing', label: 'Build', icon: '⚡', description: 'Agents working in parallel' },
  { id: 'merging', label: 'Merge', icon: '🔀', description: 'Combining all changes' },
  { id: 'testing', label: 'Test', icon: '✅', description: 'Running quality checks' },
  { id: 'complete', label: 'Done', icon: '🎉', description: 'Build complete!' },
];

// Skip cloning phase when not using template
const getVisiblePhases = (showCloning: boolean) => {
  return showCloning ? PHASES : PHASES.filter(p => p.id !== 'cloning');
};

function getPhaseIndex(phase: BuildPhase, phases: typeof PHASES): number {
  if (phase === 'idle') return -1;
  if (phase === 'failed') return -1;
  return phases.findIndex(p => p.id === phase);
}

export default function ForgeExecutionTimeline({
  currentPhase,
  currentWave = 0,
  totalWaves = 0,
  startTime,
  completedAgents = 0,
  totalAgents = 0,
}: ForgeExecutionTimelineProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCloning] = useState(currentPhase === 'cloning');

  const visiblePhases = getVisiblePhases(showCloning);
  const currentIndex = getPhaseIndex(currentPhase, visiblePhases);

  // Update elapsed time
  useEffect(() => {
    if (!startTime || currentPhase === 'idle' || currentPhase === 'complete') {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, currentPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentPhase === 'idle') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Ready to build</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header with elapsed time */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Build Progress
        </h3>
        {startTime && currentPhase !== 'complete' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            {formatTime(elapsedTime)}
          </div>
        )}
        {currentPhase === 'complete' && (
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <span>✓</span>
            {formatTime(elapsedTime)}
          </div>
        )}
      </div>

      {/* Failed state */}
      {currentPhase === 'failed' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Build Failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Check the agent panel for details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-5 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{
            width: currentPhase === 'failed'
              ? '0%'
              : `${Math.max(0, (currentIndex / (visiblePhases.length - 1)) * 100)}%`,
            maxWidth: 'calc(100% - 40px)'
          }}
        />

        {/* Phase markers */}
        <div className="relative flex justify-between">
          {visiblePhases.map((phase, idx) => {
            const isComplete = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            const isPending = currentIndex < idx;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center"
                style={{ width: `${100 / visiblePhases.length}%` }}
              >
                {/* Marker */}
                <div
                  className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}
                  `}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={isCurrent ? 'animate-pulse' : ''}>{phase.icon}</span>
                  )}

                  {/* Pulse animation for current phase */}
                  {isCurrent && currentPhase !== 'complete' && (
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25" />
                  )}
                </div>

                {/* Label */}
                <p className={`
                  mt-2 text-xs font-medium text-center
                  ${isComplete
                    ? 'text-green-600 dark:text-green-400'
                    : isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'}
                `}>
                  {phase.label}
                </p>

                {/* Description (only for current phase) */}
                {isCurrent && (
                  <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 text-center">
                    {phase.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution details (when in executing phase) */}
      {currentPhase === 'executing' && totalWaves > 0 && (
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">⚡</span>
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Wave {currentWave} of {totalWaves}
              </span>
            </div>
            <span className="text-blue-600 dark:text-blue-400">
              {completedAgents}/{totalAgents} agents done
            </span>
          </div>

          {/* Wave progress */}
          <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0}%` }}
            />
          </div>

          {/* Agent activity indicator */}
          <div className="mt-2 flex gap-1 justify-center">
            {Array.from({ length: Math.min(totalAgents, 8) }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${i < completedAgents
                    ? 'bg-green-500'
                    : 'bg-blue-400 animate-pulse'}
                `}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            {totalAgents > 8 && (
              <span className="text-xs text-blue-500 ml-1">
                +{totalAgents - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Complete celebration hint */}
      {currentPhase === 'complete' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            🎉 Build completed successfully!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Check your PR or preview the results below
          </p>
        </div>
      )}
    </div>
  );
}
