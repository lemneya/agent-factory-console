/**
 * Type Definitions Index
 *
 * Central export point for all TypeScript types used in Agent Factory Console.
 */

// API types for requests and responses
export * from './api';

// Legacy frontend types (for Vite-based prototype)
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'error';
export type RunStatus = 'running' | 'pending' | 'completed' | 'failed' | 'cancelled';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agentCount: number;
  lastActivity: string;
  createdAt: string;
  repository?: string;
  tags: string[];
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'error';
  lastRun?: string;
}

export interface Run {
  id: string;
  projectId: string;
  projectName: string;
  agentId: string;
  agentName: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  taskCount: number;
  completedTasks: number;
  logs?: string[];
}

export interface Task {
  id: string;
  runId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
  runId?: string;
}

// AFC-1.5: Terminal Matrix Types
export type TerminalMode = 'READ_ONLY' | 'INTERACTIVE';
export type TerminalStatus = 'ACTIVE' | 'CLOSED' | 'ERROR';
export type TerminalEventType = 'OUTPUT' | 'INPUT' | 'MODE_CHANGE' | 'CONNECT' | 'DISCONNECT' | 'KILL';

export interface TerminalSession {
  id: string;
  projectId: string;
  runId?: string;
  workerId?: string;
  name: string;
  mode: TerminalMode;
  status: TerminalStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface TerminalEvent {
  id: string;
  terminalSessionId: string;
  ts: string;
  type: TerminalEventType;
  actorUserId?: string;
  actorAgentId?: string;
  parentId?: string;
  data?: Record<string, unknown>;
  seq: number;
}

export interface TerminalToken {
  id: string;
  terminalSessionId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}
