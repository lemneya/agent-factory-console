'use client';

import { useState } from 'react';

interface LogEntry {
  id: string;
  workerId: string;
  taskId?: string | null;
  parentId?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
  children?: LogEntry[];
}

interface LogTreeProps {
  logs: LogEntry[];
  className?: string;
}

interface LogNodeProps {
  log: LogEntry;
  level: number;
}

/**
 * AFC-1.1: Builds a tree structure from flat logs with parentId
 */
function buildLogTree(logs: LogEntry[]): LogEntry[] {
  const logMap = new Map<string, LogEntry>();
  const rootLogs: LogEntry[] = [];

  // First pass: create map and initialize children arrays
  logs.forEach(log => {
    logMap.set(log.id, { ...log, children: [] });
  });

  // Second pass: build tree structure
  logs.forEach(log => {
    const logWithChildren = logMap.get(log.id)!;
    if (log.parentId && logMap.has(log.parentId)) {
      const parent = logMap.get(log.parentId)!;
      parent.children!.push(logWithChildren);
    } else {
      rootLogs.push(logWithChildren);
    }
  });

  // Sort by createdAt
  const sortLogs = (items: LogEntry[]) => {
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    items.forEach(item => {
      if (item.children?.length) {
        sortLogs(item.children);
      }
    });
  };
  sortLogs(rootLogs);

  return rootLogs;
}

/**
 * Get color for action type
 */
function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    REGISTERED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    HEARTBEAT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    TASK_CLAIMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    TASK_COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    TASK_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    TASK_RELEASED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    STATUS_CHANGED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    DEREGISTERED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  };
  return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
}

/**
 * Format timestamp
 */
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * AFC-1.1: Individual log node in the tree (collapsible)
 */
function LogNode({ log, level }: LogNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = log.children && log.children.length > 0;

  return (
    <div className="relative">
      {/* Connector line */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 h-full w-px bg-gray-200 dark:bg-gray-700"
          style={{ marginLeft: `${(level - 1) * 24 + 12}px` }}
        />
      )}

      {/* Log entry */}
      <div className="flex items-start gap-2 py-1" style={{ paddingLeft: `${level * 24}px` }}>
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex h-4 w-4 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Log content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(log.createdAt)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}
            >
              {log.action.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
              Worker: {log.workerId.slice(0, 8)}...
            </span>
            {log.taskId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Task: {log.taskId.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {Object.entries(log.details).map(([key, value]) => (
                <span key={key} className="mr-3">
                  {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {log.children!.map(child => (
            <LogNode key={child.id} log={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * AFC-1.1: Nested log tree component
 * Displays logs in a hierarchical tree/accordion view
 * - Orchestrator at top level
 * - Pods (Frontend/Backend/QA) nested under orchestrator
 * - Subagents nested under pod leads via parentId
 */
export function LogTree({ logs, className = '' }: LogTreeProps) {
  const tree = buildLogTree(logs);

  if (logs.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        No logs available
      </div>
    );
  }

  return (
    <div className={`space-y-1 font-mono text-sm ${className}`}>
      {tree.map(log => (
        <LogNode key={log.id} log={log} level={0} />
      ))}
    </div>
  );
}
