/**
 * Worker Types for Agent B Implementation
 *
 * Defines the type system for the worker/agent infrastructure
 */

// Worker status enum values
export const WorkerStatus = {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR',
} as const;

export type WorkerStatusType = (typeof WorkerStatus)[keyof typeof WorkerStatus];

// Worker type enum values
export const WorkerType = {
  AGENT: 'AGENT',
  HUMAN: 'HUMAN',
  SYSTEM: 'SYSTEM',
} as const;

export type WorkerTypeValue = (typeof WorkerType)[keyof typeof WorkerType];

// Task status enum values (extended from existing)
export const TaskStatus = {
  TODO: 'TODO',
  DOING: 'DOING',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// Worker registration input
export interface RegisterWorkerInput {
  name: string;
  type?: WorkerTypeValue;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

// Worker update input
export interface UpdateWorkerInput {
  name?: string;
  status?: WorkerStatusType;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

// Task claim input
export interface ClaimTaskInput {
  workerId: string;
  runId?: string;
  capabilities?: string[];
}

// Task completion input
export interface CompleteTaskInput {
  workerId: string;
  taskId: string;
  result?: Record<string, unknown>;
  status?: 'DONE' | 'FAILED' | 'BLOCKED';
  errorMsg?: string;
}

// Task result structure
export interface TaskResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Worker activity log action types
export const WorkerLogAction = {
  REGISTERED: 'REGISTERED',
  HEARTBEAT: 'HEARTBEAT',
  TASK_CLAIMED: 'TASK_CLAIMED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_RELEASED: 'TASK_RELEASED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  DEREGISTERED: 'DEREGISTERED',
} as const;

export type WorkerLogActionType =
  (typeof WorkerLogAction)[keyof typeof WorkerLogAction];

// Worker with task information
export interface WorkerWithTask {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  metadata: Record<string, unknown> | null;
  lastHeartbeat: Date;
  currentTaskId: string | null;
  currentTask?: {
    id: string;
    title: string;
    status: string;
    runId: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

// Queue statistics
export interface QueueStats {
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  totalFailed: number;
  byRun: {
    runId: string;
    runName: string;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  }[];
}

// Worker statistics
export interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  offlineWorkers: number;
  tasksCompleted: number;
  tasksFailed: number;
}

// Heartbeat timeout in milliseconds (30 seconds)
export const HEARTBEAT_TIMEOUT_MS = 30000;

// Stale worker threshold in milliseconds (2 minutes)
export const STALE_WORKER_THRESHOLD_MS = 120000;
