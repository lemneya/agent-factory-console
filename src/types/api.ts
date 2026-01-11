/**
 * API Type Definitions for Agent Factory Console
 *
 * This file contains TypeScript types for API requests and responses
 * used throughout the application.
 */

import type {
  Project,
  Run,
  Task,
  GitHubEvent,
  User,
  Repository,
  PullRequest,
  Issue,
} from '@prisma/client';

// Re-export Prisma types for convenience
export type { Project, Run, Task, GitHubEvent, User, Repository, PullRequest, Issue };

// ============================================================================
// Status Constants
// ============================================================================

export const RUN_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type RunStatus = (typeof RUN_STATUS)[keyof typeof RUN_STATUS];

export const TASK_STATUS = {
  TODO: 'TODO',
  DOING: 'DOING',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// ============================================================================
// Project Types
// ============================================================================

export interface ProjectWithRelations extends Project {
  user?: User;
  runs?: RunWithTasks[];
  events?: GitHubEvent[];
  _count?: {
    runs: number;
    events: number;
  };
}

export interface CreateProjectRequest {
  userId: string;
  repoName: string;
  repoFullName: string;
  description?: string;
  htmlUrl: string;
  lastUpdated?: string | Date;
}

export interface UpdateProjectRequest {
  repoName?: string;
  repoFullName?: string;
  description?: string | null;
  htmlUrl?: string;
  lastUpdated?: string | Date;
}

// ============================================================================
// Run Types
// ============================================================================

export interface RunWithTasks extends Run {
  tasks?: Task[];
  project?: Pick<Project, 'id' | 'repoName' | 'repoFullName' | 'htmlUrl'>;
  _count?: {
    tasks: number;
  };
}

export interface CreateRunRequest {
  projectId: string;
  name: string;
  status?: RunStatus;
}

export interface UpdateRunRequest {
  name?: string;
  status?: RunStatus;
  completedAt?: string | Date | null;
}

// ============================================================================
// Task Types
// ============================================================================

export interface TaskWithRelations extends Task {
  run?: {
    id: string;
    name: string;
    status: string;
    project?: Pick<Project, 'id' | 'repoName' | 'repoFullName'>;
  };
}

export interface CreateTaskRequest {
  runId: string;
  title: string;
  status?: TaskStatus;
  assignee?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  status?: TaskStatus;
  assignee?: string | null;
}

// ============================================================================
// GitHub Event Types
// ============================================================================

export interface GitHubEventWithProject extends GitHubEvent {
  project?: Project | null;
}

export interface CreateGitHubEventRequest {
  deliveryId?: string;
  projectId?: string;
  repositoryId?: string;
  repositoryName: string;
  eventType: string;
  action?: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  payload: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface ProjectsQueryParams {
  userId?: string;
}

export interface RunsQueryParams {
  projectId?: string;
  status?: RunStatus;
}

export interface TasksQueryParams {
  runId?: string;
  status?: TaskStatus;
  assignee?: string;
}

export interface GitHubEventsQueryParams {
  projectId?: string;
  eventType?: string;
}
