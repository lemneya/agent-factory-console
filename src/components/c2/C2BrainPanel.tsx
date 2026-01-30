/**
 * AFC-C2-STREAM-0: Brain Panel Component
 *
 * Left panel showing session info and controls
 */

'use client';

import { C2SessionStatus } from '@prisma/client';

interface C2BrainPanelProps {
  sessionId?: string;
  sessionName?: string;
  status: C2SessionStatus;
  progress: number;
  agentCount: number;
  onStart?: () => void;
  onStop?: () => void;
  onCreateSession?: () => void;
  isLoading?: boolean;
}

const STATUS_BADGES: Record<C2SessionStatus, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'bg-gray-200 text-gray-700' },
  RUNNING: { label: 'Running', color: 'bg-green-200 text-green-800 animate-pulse' },
  PAUSED: { label: 'Paused', color: 'bg-yellow-200 text-yellow-800' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-200 text-blue-800' },
  ABORTED: { label: 'Aborted', color: 'bg-red-200 text-red-800' },
};

export function C2BrainPanel({
  sessionId,
  sessionName,
  status,
  progress,
  agentCount,
  onStart,
  onStop,
  onCreateSession,
  isLoading,
}: C2BrainPanelProps) {
  const badge = STATUS_BADGES[status];
  const canStart = status === 'IDLE' || status === 'ABORTED' || status === 'COMPLETED';
  const canStop = status === 'RUNNING';

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Brain
      </h3>

      {!sessionId ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 mb-4">No active session</p>
          <button
            onClick={onCreateSession}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      ) : (
        <>
          {/* Session Info */}
          <div className="space-y-3 mb-4">
            <div>
              <span className="text-xs text-gray-500">Session</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {sessionName || 'Unnamed'}
              </p>
            </div>

            <div>
              <span className="text-xs text-gray-500">Status</span>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500">Agents</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {agentCount}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {canStart && (
              <button
                onClick={onStart}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Starting...' : 'Simulate Swarm'}
              </button>
            )}
            {canStop && (
              <button
                onClick={onStop}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Stopping...' : 'Abort'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
