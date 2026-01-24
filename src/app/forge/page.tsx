'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SignedOutCTA, useDemoMode } from '@/components/auth';
import {
  ForgeSpecInput,
  ForgeAgentPanel,
  ForgeHITLPanel,
  ForgeBuildResults,
  type ForgeHITLQuestion,
  type AgentDisplayStatus,
} from '@/components/forge';
import type { DecomposedSpec, TechStack } from '@/lib/forge';

type BuildStatus = 'idle' | 'planning' | 'executing' | 'merging' | 'complete' | 'failed';

interface ParallelizationStats {
  totalWorkstreams: number;
  totalWaves: number;
  maxParallelAgents: number;
  estimatedSequentialMinutes: number;
  estimatedParallelMinutes: number;
  speedupFactor: number;
}

export default function ForgePage() {
  const { status } = useSession();
  const { isDemoMode: demoMode } = useDemoMode();

  const [isLoading, setIsLoading] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [decomposition, setDecomposition] = useState<DecomposedSpec | null>(null);
  const [stats, setStats] = useState<ParallelizationStats | null>(null);
  const [agents, setAgents] = useState<AgentDisplayStatus[]>([]);
  const [currentWave, setCurrentWave] = useState(0);
  const [hitlQuestions, setHitlQuestions] = useState<ForgeHITLQuestion[]>([]);
  const [prUrl, setPrUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const isSignedOut = status === 'unauthenticated' && !demoMode;

  const handleSubmit = useCallback(
    async (spec: string, techStack: TechStack, dryRun: boolean) => {
      setIsLoading(true);
      setError(null);
      setBuildStatus('planning');

      try {
        const response = await fetch('/api/forge/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spec, techStack, dryRun }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process build request');
        }

        setDecomposition(data.decomposition);
        setStats(data.parallelization);

        if (dryRun) {
          setBuildStatus('idle');
        } else {
          // TODO: Handle actual build execution
          // This would involve polling for status updates
          setBuildStatus('executing');

          // Mock agents for now based on decomposition
          const mockAgents: AgentDisplayStatus[] = data.decomposition.workstreams.map(
            (ws: { id: string }) => ({
              workstreamId: ws.id,
              status: 'pending' as const,
              startedAt: undefined,
              output: undefined,
              error: undefined,
            })
          );
          setAgents(mockAgents);
          setCurrentWave(1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setBuildStatus('failed');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleHITLAnswer = useCallback(async (questionId: string, answer: string) => {
    // TODO: Send answer to backend
    setHitlQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, answer, answeredAt: new Date() } : q
      )
    );
  }, []);

  if (isSignedOut) {
    return (
      <div data-testid="page-root">
        <h1
          className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          data-testid="page-title"
        >
          Forge
        </h1>
        <SignedOutCTA />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="page-root">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900 dark:text-white"
            data-testid="page-title"
          >
            Forge
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Multi-agent spec execution with parallel workstreams
          </p>
        </div>
        <div className="flex items-center gap-3">
          {demoMode && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              DEMO (read-only)
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main content - 3 column layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left column - Spec Input */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto">
          <ForgeSpecInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* HITL Panel */}
          <ForgeHITLPanel questions={hitlQuestions} onAnswer={handleHITLAnswer} />
        </div>

        {/* Middle column - Build Results */}
        <div className="col-span-4 overflow-y-auto">
          <ForgeBuildResults
            decomposition={decomposition}
            stats={stats}
            buildStatus={buildStatus}
            prUrl={prUrl}
          />
        </div>

        {/* Right column - Agent Panel */}
        <div className="col-span-4 overflow-y-auto">
          <ForgeAgentPanel
            agents={agents}
            currentWave={currentWave}
            totalWaves={decomposition?.executionWaves.length || 0}
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              Powered by Claude Code + Wave-based parallel execution
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              API Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
