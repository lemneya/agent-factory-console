/**
 * AFC-C2-STREAM-0: Ops Console Component
 *
 * Bottom panel showing real-time logs from the C2 session
 */

'use client';

import { useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface C2OpsConsoleProps {
  logs: LogEntry[];
  maxHeight?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: 'text-blue-600 dark:text-blue-400',
  WARN: 'text-yellow-600 dark:text-yellow-400',
  ERROR: 'text-red-600 dark:text-red-400',
  DEBUG: 'text-gray-500 dark:text-gray-400',
};

export function C2OpsConsole({ logs, maxHeight = '200px' }: C2OpsConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">Ops Console</h3>
        <span className="text-xs text-gray-500">{logs.length} entries</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-2"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">No logs yet...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 py-0.5 hover:bg-gray-800">
              <span className="text-gray-500 shrink-0">[{formatTime(log.timestamp)}]</span>
              <span className={`shrink-0 w-12 ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
                {log.level}
              </span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
