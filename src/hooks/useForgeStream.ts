'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AgentDisplayStatus } from '@/components/forge';
import type { ForgeHITLQuestion } from '@/components/forge';

export type BuildStatus = 'idle' | 'planning' | 'executing' | 'merging' | 'testing' | 'complete' | 'failed';

interface WorkstreamData {
  id: string;
  workstreamKey: string;
  name: string;
  agent: string;
  wave: number;
  status: string;
  output?: string;
  errorMessage?: string;
  durationMs?: number;
}

interface QuestionData {
  id: string;
  workstreamId?: string;
  question: string;
  questionType: string;
  optionsJson?: string[];
  answer?: string;
  answeredAt?: string;
}

interface StreamState {
  buildId: string | null;
  buildStatus: BuildStatus;
  currentWave: number;
  totalWaves: number;
  agents: AgentDisplayStatus[];
  questions: ForgeHITLQuestion[];
  prUrl?: string;
  error?: string;
}

function mapDbStatus(status: string): AgentDisplayStatus['status'] {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'RUNNING':
      return 'running';
    case 'WAITING_INPUT':
      return 'waiting_input';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}

function mapBuildStatus(status: string): BuildStatus {
  switch (status) {
    case 'PENDING':
    case 'DECOMPOSING':
      return 'planning';
    case 'EXECUTING':
      return 'executing';
    case 'MERGING':
      return 'merging';
    case 'TESTING':
      return 'testing';
    case 'COMPLETED':
      return 'complete';
    case 'FAILED':
      return 'failed';
    default:
      return 'idle';
  }
}

export function useForgeStream() {
  const [state, setState] = useState<StreamState>({
    buildId: null,
    buildStatus: 'idle',
    currentWave: 0,
    totalWaves: 0,
    agents: [],
    questions: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startBuild = useCallback(async (spec: string, techStack: Record<string, unknown>) => {
    // Reset state
    setState({
      buildId: null,
      buildStatus: 'planning',
      currentWave: 0,
      totalWaves: 0,
      agents: [],
      questions: [],
    });

    try {
      // Start the build
      const response = await fetch('/api/forge/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec, techStack }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start build');
      }

      const { buildId, streamUrl } = data;
      setState((prev) => ({ ...prev, buildId }));

      // Connect to SSE stream
      connectToStream(buildId, streamUrl);

      return buildId;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        buildStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      throw error;
    }
  }, []);

  const connectToStream = useCallback((buildId: string, streamUrl: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('init', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        buildId,
        buildStatus: mapBuildStatus(data.build.status),
        currentWave: data.build.currentWave,
        totalWaves: data.build.totalWaves,
        prUrl: data.build.prUrl,
        error: data.build.errorMessage,
        agents: data.workstreams.map((ws: WorkstreamData) => ({
          workstreamId: ws.workstreamKey,
          status: mapDbStatus(ws.status),
          output: ws.output,
          error: ws.errorMessage,
        })),
        questions: data.questions.map((q: QuestionData) => ({
          id: q.id,
          workstreamId: q.workstreamId || '',
          question: q.question,
          type: q.questionType.toLowerCase() as 'text' | 'choice' | 'confirm',
          options: q.optionsJson,
          answer: q.answer,
          answeredAt: q.answeredAt ? new Date(q.answeredAt) : undefined,
        })),
      }));
    });

    eventSource.addEventListener('decomposed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        totalWaves: data.totalWaves,
        agents: data.workstreams.map((ws: WorkstreamData) => ({
          workstreamId: ws.workstreamKey,
          status: mapDbStatus(ws.status),
        })),
      }));
    });

    eventSource.addEventListener('wave_start', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        currentWave: data.wave,
        buildStatus: 'executing',
      }));
    });

    eventSource.addEventListener('workstream_start', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) =>
          a.workstreamId === data.workstreamKey
            ? { ...a, status: 'running' as const, startedAt: new Date() }
            : a
        ),
      }));
    });

    eventSource.addEventListener('workstream_complete', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) =>
          a.workstreamId === data.workstreamKey
            ? { ...a, status: 'completed' as const, output: data.output }
            : a
        ),
      }));
    });

    eventSource.addEventListener('workstream_failed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) =>
          a.workstreamId === data.workstreamKey
            ? { ...a, status: 'failed' as const, error: data.error }
            : a
        ),
      }));
    });

    eventSource.addEventListener('question_asked', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        questions: [
          ...prev.questions,
          {
            id: data.questionId,
            workstreamId: data.workstreamId || '',
            question: data.question,
            type: data.questionType.toLowerCase() as 'text' | 'choice' | 'confirm',
            options: data.options,
          },
        ],
        agents: prev.agents.map((a) =>
          a.workstreamId === data.workstreamKey
            ? { ...a, status: 'waiting_input' as const }
            : a
        ),
      }));
    });

    eventSource.addEventListener('question_answered', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === data.questionId
            ? { ...q, answer: data.answer, answeredAt: new Date(data.answeredAt) }
            : q
        ),
      }));
    });

    eventSource.addEventListener('workstream_resumed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) =>
          a.workstreamId === data.workstreamKey
            ? { ...a, status: 'running' as const }
            : a
        ),
      }));
    });

    eventSource.addEventListener('merge_start', () => {
      setState((prev) => ({ ...prev, buildStatus: 'merging' }));
    });

    eventSource.addEventListener('test_start', () => {
      setState((prev) => ({ ...prev, buildStatus: 'testing' }));
    });

    eventSource.addEventListener('build_complete', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        buildStatus: 'complete',
        prUrl: data.prUrl,
      }));
      eventSource.close();
    });

    eventSource.addEventListener('build_failed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        buildStatus: 'failed',
        error: data.message,
      }));
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      // Try to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connectToStream(buildId, streamUrl);
        }
      }, 3000);
    });
  }, []);

  const answerQuestion = useCallback(async (questionId: string, answer: string) => {
    if (!state.buildId) return;

    const response = await fetch(`/api/forge/builds/${state.buildId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to answer question');
    }
  }, [state.buildId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({
      buildId: null,
      buildStatus: 'idle',
      currentWave: 0,
      totalWaves: 0,
      agents: [],
      questions: [],
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startBuild,
    answerQuestion,
    disconnect,
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
  };
}
