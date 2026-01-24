/**
 * ForgeAI - Agent Orchestrator
 * Manages parallel execution of agent workstreams using wave-based fan-out/fan-in
 */

import {
  DecomposedSpec,
  Workstream,
  AgentResult,
  BuildState,
  AgentStatus,
} from './types';
import { decomposeSpec, validateDecomposition } from './decomposer';
import { spawnAgent, AgentHandle } from './agent-spawner';
import { mergeAgentBranches } from './merger';

// Event types for real-time updates
export type OrchestratorEvent =
  | { type: 'decomposition_start' }
  | { type: 'decomposition_complete'; spec: DecomposedSpec }
  | { type: 'wave_start'; wave: number; workstreams: string[] }
  | { type: 'agent_start'; workstreamId: string }
  | { type: 'agent_progress'; workstreamId: string; message: string }
  | { type: 'agent_hitl'; workstreamId: string; question: string }
  | { type: 'agent_complete'; workstreamId: string; result: AgentResult }
  | { type: 'agent_failed'; workstreamId: string; error: string }
  | { type: 'wave_complete'; wave: number }
  | { type: 'merge_start' }
  | { type: 'merge_complete'; branch: string }
  | { type: 'build_complete'; state: BuildState }
  | { type: 'build_failed'; error: string };

export type EventListener = (event: OrchestratorEvent) => void;

/**
 * Orchestrator class - manages the full build lifecycle
 */
export class Orchestrator {
  private state: BuildState;
  private listeners: EventListener[] = [];
  private activeAgents: Map<string, AgentHandle> = new Map();
  private aborted = false;

  constructor(buildId: string, spec: string) {
    this.state = {
      id: buildId,
      spec,
      currentWave: 0,
      agentResults: [],
      status: 'decomposing',
      startedAt: new Date(),
    };
  }

  /**
   * Subscribe to orchestrator events
   */
  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: OrchestratorEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    }
  }

  /**
   * Get current build state
   */
  getState(): BuildState {
    return { ...this.state };
  }

  /**
   * Abort the build
   */
  async abort(): Promise<void> {
    this.aborted = true;

    // Kill all active agents
    for (const [id, handle] of this.activeAgents) {
      try {
        await handle.kill();
        this.emit({ type: 'agent_failed', workstreamId: id, error: 'Aborted' });
      } catch (e) {
        console.error(`Failed to kill agent ${id}:`, e);
      }
    }

    this.state.status = 'failed';
    this.emit({ type: 'build_failed', error: 'Build aborted by user' });
  }

  /**
   * Answer a HITL question for an agent
   */
  async answerHITL(workstreamId: string, answer: string): Promise<void> {
    const handle = this.activeAgents.get(workstreamId);
    if (handle) {
      await handle.sendInput(answer);
    }
  }

  /**
   * Execute the full build
   */
  async execute(repoPath: string): Promise<BuildState> {
    try {
      // Phase 1: Decompose spec
      this.emit({ type: 'decomposition_start' });
      const decomposed = await decomposeSpec(this.state.spec);

      // Validate decomposition
      const errors = validateDecomposition(decomposed);
      if (errors.length > 0) {
        throw new Error(`Invalid decomposition: ${errors.join(', ')}`);
      }

      this.state.decomposedSpec = decomposed;
      this.emit({ type: 'decomposition_complete', spec: decomposed });

      // Phase 2: Execute waves
      this.state.status = 'executing';
      await this.executeWaves(decomposed, repoPath);

      if (this.aborted) {
        return this.state;
      }

      // Phase 3: Merge branches
      this.state.status = 'merging';
      this.emit({ type: 'merge_start' });
      const mergedBranch = await mergeAgentBranches(
        repoPath,
        this.state.agentResults.map((r) => r.branch)
      );
      this.state.mergedBranch = mergedBranch;
      this.emit({ type: 'merge_complete', branch: mergedBranch });

      // Phase 4: Final status
      this.state.status = 'completed';
      this.state.completedAt = new Date();
      this.emit({ type: 'build_complete', state: this.state });

      return this.state;
    } catch (error) {
      this.state.status = 'failed';
      const message = error instanceof Error ? error.message : String(error);
      this.emit({ type: 'build_failed', error: message });
      throw error;
    }
  }

  /**
   * Execute all waves in sequence, with parallel agents within each wave
   */
  private async executeWaves(
    spec: DecomposedSpec,
    repoPath: string
  ): Promise<void> {
    for (let i = 0; i < spec.executionWaves.length; i++) {
      if (this.aborted) break;

      this.state.currentWave = i;
      const wave = spec.executionWaves[i];
      const workstreams = wave
        .map((id) => spec.workstreams.find((w) => w.id === id))
        .filter((w): w is Workstream => w !== undefined);

      this.emit({ type: 'wave_start', wave: i, workstreams: wave });

      // Execute all agents in this wave in parallel
      const results = await this.executeWaveParallel(workstreams, repoPath);

      // Check for failures
      const failed = results.filter((r) => r.status === 'failed');
      if (failed.length > 0) {
        throw new Error(
          `Wave ${i} failed: ${failed.map((f) => f.workstreamId).join(', ')}`
        );
      }

      this.state.agentResults.push(...results);
      this.emit({ type: 'wave_complete', wave: i });
    }
  }

  /**
   * Execute all agents in a wave in parallel
   */
  private async executeWaveParallel(
    workstreams: Workstream[],
    repoPath: string
  ): Promise<AgentResult[]> {
    const promises = workstreams.map((ws) =>
      this.executeAgent(ws, repoPath)
    );

    return Promise.all(promises);
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    workstream: Workstream,
    repoPath: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    this.emit({ type: 'agent_start', workstreamId: workstream.id });

    try {
      // Spawn the agent
      const handle = await spawnAgent({
        workstream,
        repoPath,
        onProgress: (message) => {
          this.emit({
            type: 'agent_progress',
            workstreamId: workstream.id,
            message,
          });
        },
        onHITL: (question) => {
          this.emit({
            type: 'agent_hitl',
            workstreamId: workstream.id,
            question,
          });
        },
      });

      this.activeAgents.set(workstream.id, handle);

      // Wait for completion
      const output = await handle.wait();

      this.activeAgents.delete(workstream.id);

      const result: AgentResult = {
        workstreamId: workstream.id,
        agent: workstream.agent,
        status: 'completed',
        branch: `agent/${workstream.id}`,
        filesCreated: output.filesCreated || [],
        filesModified: output.filesModified || [],
        output: output.summary || '',
        durationMs: Date.now() - startTime,
      };

      this.emit({ type: 'agent_complete', workstreamId: workstream.id, result });
      return result;
    } catch (error) {
      this.activeAgents.delete(workstream.id);

      const message = error instanceof Error ? error.message : String(error);
      this.emit({
        type: 'agent_failed',
        workstreamId: workstream.id,
        error: message,
      });

      return {
        workstreamId: workstream.id,
        agent: workstream.agent,
        status: 'failed',
        branch: `agent/${workstream.id}`,
        filesCreated: [],
        filesModified: [],
        output: '',
        error: message,
        durationMs: Date.now() - startTime,
      };
    }
  }
}

/**
 * Create and start a new build
 */
export async function startBuild(
  spec: string,
  repoPath: string,
  onEvent?: EventListener
): Promise<BuildState> {
  const buildId = `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const orchestrator = new Orchestrator(buildId, spec);

  if (onEvent) {
    orchestrator.on(onEvent);
  }

  return orchestrator.execute(repoPath);
}

/**
 * Calculate optimal parallelization for a spec
 */
export function calculateParallelization(spec: DecomposedSpec): {
  maxParallel: number;
  sequentialTime: number;
  parallelTime: number;
  speedup: number;
} {
  // Sequential time = sum of all
  const sequentialTime = spec.workstreams.reduce(
    (sum, ws) => sum + ws.estimatedMinutes,
    0
  );

  // Parallel time = sum of wave maximums
  let parallelTime = 0;
  let maxParallel = 0;

  for (const wave of spec.executionWaves) {
    maxParallel = Math.max(maxParallel, wave.length);

    const waveMax = Math.max(
      ...wave.map((id) => {
        const ws = spec.workstreams.find((w) => w.id === id);
        return ws?.estimatedMinutes || 0;
      })
    );
    parallelTime += waveMax;
  }

  return {
    maxParallel,
    sequentialTime,
    parallelTime,
    speedup: sequentialTime / parallelTime,
  };
}
