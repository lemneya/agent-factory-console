/**
 * ForgeAI - Spec Execution Agent Maximizer
 *
 * A multi-agent orchestration system that breaks down specs
 * and executes them in parallel using specialized AI agents.
 *
 * @example
 * ```typescript
 * import { startBuild } from '@/lib/forge';
 *
 * const result = await startBuild(
 *   "Build a todo app with auth and dark mode",
 *   "/path/to/repo",
 *   (event) => console.log(event)
 * );
 * ```
 */

// Types
export type {
  AgentRole,
  Workstream,
  IntegrationPoint,
  DecomposedSpec,
  AgentStatus,
  AgentResult,
  BuildState,
  TechStack,
  BuildRequest,
} from './types';

// Decomposer
export { decomposeSpec, validateDecomposition } from './decomposer';

// Orchestrator
export {
  Orchestrator,
  startBuild,
  calculateParallelization,
  type OrchestratorEvent,
  type EventListener,
} from './orchestrator';

// Agent Spawner
export {
  spawnAgent,
  isAgentAvailable,
  getAvailableAgents,
  type AgentType,
  type AgentHandle,
  type AgentOutput,
  type SpawnOptions,
} from './agent-spawner';

// Git Isolation
export {
  createWorktree,
  removeWorktree,
  listWorktrees,
  commitWorktree,
  pushWorktree,
  cleanupAllWorktrees,
  getWorktreeDiff,
  hasUncommittedChanges,
} from './git-isolation';

// Merger
export {
  mergeAgentBranches,
  createPullRequest,
  validateMerge,
  generateMergeSummary,
  type MergeResult,
  type MergeConflict,
} from './merger';
