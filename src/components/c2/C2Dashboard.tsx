/**
 * AFC-C2-STREAM-0: C2 Dashboard Component
 *
 * Main dashboard with 3-pane layout (Brain/Swarm/Vault) + bottom Ops Console
 * Connects to SSE stream for real-time updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { C2SessionStatus, C2AgentState, C2ArtifactType } from '@prisma/client';
import { C2AgentGrid } from './C2AgentGrid';
import { C2OpsConsole } from './C2OpsConsole';
import { C2VaultPanel } from './C2VaultPanel';
import { C2BrainPanel } from './C2BrainPanel';

interface AgentState {
  index: number;
  state: C2AgentState;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface Artifact {
  id: string;
  name: string;
  type: C2ArtifactType;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  status: C2SessionStatus;
  agentCount: number;
  gridRows: number;
  gridCols: number;
}

export function C2Dashboard() {
  // Session state
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time state
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [progress, setProgress] = useState(0);
  const [selectedArtifact, setSelectedArtifact] = useState<string | undefined>();

  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize agents array
  useEffect(() => {
    if (session) {
      const initialAgents = Array.from({ length: session.agentCount }, (_, i) => ({
        index: i,
        state: 'IDLE' as C2AgentState,
      }));
      setAgents(initialAgents);
    }
  }, [session?.id, session?.agentCount]);

  // Connect to SSE stream when session is active
  useEffect(() => {
    if (!session?.id) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/c2/stream?sessionId=${session.id}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', e => {
      const data = JSON.parse(e.data);
      console.log('[C2] SSE connected:', data);
    });

    eventSource.addEventListener('agent_state', e => {
      const data = JSON.parse(e.data);
      setAgents(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(a => a.index === data.agentIndex);
        if (idx !== -1) {
          updated[idx] = { index: data.agentIndex, state: data.agentState };
        }
        return updated;
      });
    });

    eventSource.addEventListener('progress', e => {
      const data = JSON.parse(e.data);
      setProgress(data.progress ?? 0);
    });

    eventSource.addEventListener('log', e => {
      const data = JSON.parse(e.data);
      setLogs(prev =>
        [
          ...prev,
          {
            id: data.id,
            timestamp: data.timestamp,
            level: data.level || 'INFO',
            message: data.message || '',
          },
        ].slice(-100)
      ); // Keep last 100 logs
    });

    eventSource.addEventListener('artifact_created', e => {
      const data = JSON.parse(e.data);
      setArtifacts(prev => [
        {
          id: data.artifactId,
          name: data.artifactName || data.payload?.name || 'Unknown',
          type: data.artifactType || 'OTHER',
          createdAt: data.timestamp,
        },
        ...prev,
      ]);
    });

    eventSource.addEventListener('session_start', () => {
      setSession(prev => (prev ? { ...prev, status: 'RUNNING' } : null));
      setProgress(0);
    });

    eventSource.addEventListener('session_stop', () => {
      setSession(prev => (prev ? { ...prev, status: 'COMPLETED' } : null));
    });

    eventSource.addEventListener('session_abort', () => {
      setSession(prev => (prev ? { ...prev, status: 'ABORTED' } : null));
    });

    eventSource.onerror = () => {
      console.error('[C2] SSE connection error');
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [session?.id]);

  // Create a new session
  const createSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/c2/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Session ${new Date().toLocaleTimeString()}`,
          agentCount: 20,
          gridRows: 4,
          gridCols: 5,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }
      const data = await res.json();
      setSession({
        id: data.id,
        name: data.name,
        status: data.status,
        agentCount: data.agentCount,
        gridRows: data.gridRows,
        gridCols: data.gridCols,
      });
      setLogs([]);
      setArtifacts([]);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start simulation
  const startSimulation = useCallback(async () => {
    if (!session?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/c2/sessions/${session.id}/simulate/start`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start simulation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  // Stop simulation
  const stopSimulation = useCallback(async () => {
    if (!session?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/c2/sessions/${session.id}/simulate/stop`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to stop simulation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  return (
    <div className="h-full flex flex-col gap-4" data-testid="c2-dashboard">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 3-Pane Layout: Brain | Swarm | Vault */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Brain Panel - Left */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
          <C2BrainPanel
            sessionId={session?.id}
            sessionName={session?.name}
            status={session?.status || 'IDLE'}
            progress={progress}
            agentCount={session?.agentCount || 20}
            onStart={startSimulation}
            onStop={stopSimulation}
            onCreateSession={createSession}
            isLoading={isLoading}
          />
        </div>

        {/* Swarm Grid - Center */}
        <div className="col-span-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
          <C2AgentGrid
            agents={agents}
            rows={session?.gridRows || 4}
            cols={session?.gridCols || 5}
          />
        </div>

        {/* Vault Panel - Right */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
          <C2VaultPanel
            artifacts={artifacts}
            selectedId={selectedArtifact}
            onSelect={setSelectedArtifact}
          />
        </div>
      </div>

      {/* Ops Console - Bottom */}
      <div className="h-52 shrink-0">
        <C2OpsConsole logs={logs} maxHeight="180px" />
      </div>
    </div>
  );
}
