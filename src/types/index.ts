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
