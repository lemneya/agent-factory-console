'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { SignedOutCTA, useDemoMode } from '@/components/auth';
import {
  ForgeSpecInput,
  ForgeAgentPanel,
  ForgeHITLPanel,
  ForgeBuildResults,
} from '@/components/forge';
import { useForgeStream } from '@/hooks/useForgeStream';
import type { DecomposedSpec, TechStack } from '@/lib/forge';

interface ParallelizationStats {
  totalWorkstreams: number;
  totalWaves: number;
  maxParallelAgents: number;
  estimatedSequentialMinutes: number;
  estimatedParallelMinutes: number;
  speedupFactor: number;
}

interface BuildHistoryItem {
  id: string;
  spec: string;
  status: string;
  currentWave: number;
  totalWaves: number;
  prUrl?: string;
  workstreamCount: number;
  createdAt: string;
  completedAt?: string;
}

function ForgeContent() {
  const { status } = useSession();
  const { isDemoMode: demoMode } = useDemoMode();

  // Stream hook for real-time updates
  const stream = useForgeStream();

  // Local state for dry run preview
  const [isLoading, setIsLoading] = useState(false);
  const [decomposition, setDecomposition] = useState<DecomposedSpec | null>(null);
  const [stats, setStats] = useState<ParallelizationStats | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Build history
  const [history, setHistory] = useState<BuildHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const isSignedOut = status === 'unauthenticated' && !demoMode;

  // Fetch build history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/forge/builds?limit=10');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.builds || []);
        }
      } catch (err) {
        console.error('Failed to fetch build history:', err);
      }
    }
    if (!isSignedOut) {
      fetchHistory();
    }
  }, [isSignedOut, stream.buildStatus]);

  const handleSubmit = useCallback(
    async (spec: string, techStack: TechStack, dryRun: boolean) => {
      setIsLoading(true);
      setLocalError(null);

      try {
        if (dryRun) {
          // Dry run - just preview the decomposition
          const response = await fetch('/api/forge/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec, techStack, dryRun: true }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to process build request');
          }

          setDecomposition(data.decomposition);
          setStats(data.parallelization);
        } else {
          // Real build - use the stream API
          setDecomposition(null);
          setStats(null);
          await stream.startBuild(spec, techStack as Record<string, unknown>);
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [stream]
  );

  const handleHITLAnswer = useCallback(
    async (questionId: string, answer: string) => {
      await stream.answerQuestion(questionId, answer);
    },
    [stream]
  );

  // Determine which data to show (stream or local)
  const displayStatus = stream.buildId ? stream.buildStatus : (decomposition ? 'idle' : 'idle');
  const displayWave = stream.buildId ? stream.currentWave : 0;
  const displayTotalWaves = stream.buildId ? stream.totalWaves : (decomposition?.executionWaves.length || 0);
  const displayAgents = stream.buildId ? stream.agents : [];
  const displayQuestions = stream.buildId ? stream.questions : [];
  const displayPrUrl = stream.prUrl;
  const displayError = stream.error || localError;

  // Show loading state
  if (status === 'loading') {
    return (
      <div data-testid="page-root">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Forge
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Multi-agent spec execution with parallel workstreams
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

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
          {stream.buildId && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Build: {stream.buildId.slice(0, 8)}
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {showHistory ? 'Hide History' : 'History'} ({history.length})
          </button>
          {demoMode && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              DEMO (read-only)
            </span>
          )}
        </div>
      </div>

      {/* Build History Panel */}
      {showHistory && history.length > 0 && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Recent Builds
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((build) => (
              <div
                key={build.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white truncate">
                    {build.spec}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {new Date(build.createdAt).toLocaleString()} | {build.workstreamCount} workstreams
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      build.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : build.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {build.status}
                  </span>
                  {build.prUrl && (
                    <a
                      href={build.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      PR
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {displayError && (
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
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{displayError}</p>
          </div>
        </div>
      )}

      {/* Main content - 3 column layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left column - Spec Input */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto">
          <ForgeSpecInput onSubmit={handleSubmit} isLoading={isLoading || stream.buildStatus === 'planning'} />

          {/* HITL Panel */}
          <ForgeHITLPanel questions={displayQuestions} onAnswer={handleHITLAnswer} />
        </div>

        {/* Middle column - Build Results */}
        <div className="col-span-4 overflow-y-auto">
          <ForgeBuildResults
            decomposition={decomposition}
            stats={stats}
            buildStatus={displayStatus}
            prUrl={displayPrUrl}
          />
        </div>

        {/* Right column - Agent Panel */}
        <div className="col-span-4 overflow-y-auto">
          <ForgeAgentPanel
            agents={displayAgents}
            currentWave={displayWave}
            totalWaves={displayTotalWaves}
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
            {stream.isConnected && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
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

export default function ForgePage() {
  return (
    <Suspense
      fallback={
        <div data-testid="page-root">
          <div className="mb-6">
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
          <div className="animate-pulse">
            <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <ForgeContent />
    </Suspense>
  );
}
