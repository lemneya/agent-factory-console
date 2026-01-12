'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Task {
  id: string;
  status: string;
  title: string;
}

interface RunStatus {
  runId: string;
  status: string;
  tasks?: Task[];
  timestamp: string;
}

interface UseRunStatusOptions {
  // AFC-1.1: Polling interval when SSE fails (default 5 seconds)
  pollingInterval?: number;
  // Auto-reconnect SSE on disconnect
  autoReconnect?: boolean;
}

/**
 * AFC-1.1: Hook for real-time run status with SSE + fallback polling
 * - Uses SSE for real-time updates when available
 * - Falls back to polling if SSE disconnects
 * - Keeps Approve/Reject available even if SSE drops
 */
export function useRunStatus(runId: string, options: UseRunStatusOptions = {}) {
  const { pollingInterval = 5000, autoReconnect = true } = options;

  const [status, setStatus] = useState<RunStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status via REST API (fallback polling)
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/runs/${runId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          runId: data.id,
          status: data.status,
          tasks: data.tasks,
          timestamp: new Date().toISOString(),
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching run status:', err);
      setError('Failed to fetch run status');
    }
  }, [runId]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setIsConnected(false);
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    // Connect to SSE stream
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const eventSource = new EventSource(`/api/runs/${runId}/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          // Stop polling when SSE connects
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsPolling(false);
          }
        };

        eventSource.addEventListener('status', event => {
          try {
            const data = JSON.parse(event.data);
            setStatus(data);
          } catch (err) {
            console.error('Error parsing SSE status:', err);
          }
        });

        eventSource.addEventListener('ping', () => {
          // AFC-1.1: Keepalive received, connection is alive
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();
          eventSourceRef.current = null;

          // AFC-1.1: Fall back to polling when SSE fails
          if (!pollingIntervalRef.current) {
            setIsPolling(true);
            fetchStatus();
            pollingIntervalRef.current = setInterval(fetchStatus, pollingInterval);
          }

          // Attempt to reconnect after delay
          if (autoReconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, 5000);
          }
        };
      } catch (err) {
        console.error('Error connecting to SSE:', err);
        setError('Failed to connect to stream');
        // Fall back to polling
        if (!pollingIntervalRef.current) {
          setIsPolling(true);
          fetchStatus();
          pollingIntervalRef.current = setInterval(fetchStatus, pollingInterval);
        }
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsConnected(false);
      setIsPolling(false);
    };
  }, [runId, autoReconnect, pollingInterval, fetchStatus]);

  return {
    status,
    isConnected,
    isPolling,
    error,
    refresh,
    disconnect,
  };
}
