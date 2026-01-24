/**
 * ForgeAI - Spec Execution Agent Maximizer
 * Core type definitions
 */

// Agent roles for parallel execution
export type AgentRole =
  | 'data'        // Schema, migrations, seeds
  | 'auth'        // Authentication, sessions, RBAC
  | 'api'         // Routes, validation, business logic
  | 'ui'          // Pages, components, forms
  | 'integrations' // Stripe, email, webhooks
  | 'qa';         // Tests, linting, types

// Workstream definition from decomposer
export interface Workstream {
  id: string;
  name: string;
  agent: AgentRole;
  priority: number;  // Lower = executes earlier
  owns: string[];    // File paths this agent owns
  produces: string[]; // What this agent outputs
  blockedBy: string[]; // IDs of workstreams that must complete first
  estimatedMinutes: number;
  prompt: string;    // Detailed instructions for the agent
}

// Integration point between agents
export interface IntegrationPoint {
  from: string;      // Source workstream ID
  to: string;        // Target workstream ID
  contract: string;  // Description of the interface
  files: string[];   // Files involved in integration
}

// Decomposed spec ready for execution
export interface DecomposedSpec {
  originalSpec: string;
  workstreams: Workstream[];
  integrationPoints: IntegrationPoint[];
  executionWaves: string[][]; // Groups of workstream IDs to run in parallel
  estimatedTotalMinutes: number;
  // Inventory metadata (when templates are used)
  inventoryUsed?: string[]; // Feature IDs from inventory
  requiredPackages?: string[]; // npm packages needed
  requiredEnvVars?: string[]; // Environment variables needed
  // Starter template (when clone-first approach is used)
  starterTemplate?: {
    id: string;
    name: string;
    repoUrl: string;
    customizationMinutes: number;
    timeSavedPercent: number;
  };
  // Build strategy
  strategy: 'from-scratch' | 'with-inventory' | 'clone-and-customize';
}

// Agent execution status
export type AgentStatus =
  | 'pending'
  | 'running'
  | 'waiting_input'  // HITL - needs human input
  | 'completed'
  | 'failed';

// Result from a single agent
export interface AgentResult {
  workstreamId: string;
  agent: AgentRole;
  status: AgentStatus;
  branch: string;
  filesCreated: string[];
  filesModified: string[];
  output: string;
  error?: string;
  durationMs: number;
}

// Overall build state
export interface BuildState {
  id: string;
  spec: string;
  decomposedSpec?: DecomposedSpec;
  currentWave: number;
  agentResults: AgentResult[];
  mergedBranch?: string;
  testsPass?: boolean;
  deployUrl?: string;
  status: 'decomposing' | 'executing' | 'merging' | 'testing' | 'deploying' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

// Tech stack preferences
export interface TechStack {
  frontend?: 'nextjs' | 'react' | 'vue' | 'svelte';
  backend?: 'nextjs-api' | 'express' | 'fastapi' | 'trpc';
  database?: 'postgres' | 'mysql' | 'mongodb' | 'supabase';
  auth?: 'nextauth' | 'clerk' | 'supabase-auth' | 'custom';
  styling?: 'tailwind' | 'css-modules' | 'styled-components';
  deployment?: 'vercel' | 'railway' | 'fly' | 'docker';
}

// Build request from user
export interface BuildRequest {
  spec: string;
  repoUrl?: string;
  techStack?: Partial<TechStack>;
  maxAgents?: number; // Default 6
}
