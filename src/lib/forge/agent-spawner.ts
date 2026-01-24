/**
 * ForgeAI - Agent Spawner
 * Spawns and manages coding agents (Claude Code, OpenHands, Aider)
 */

import { spawn, ChildProcess } from 'child_process';
import { Workstream } from './types';
import { createWorktree, removeWorktree } from './git-isolation';

// Agent types we support
export type AgentType = 'claude-code' | 'openhands' | 'aider' | 'mock';

// Output from an agent run
export interface AgentOutput {
  summary: string;
  filesCreated: string[];
  filesModified: string[];
  prUrl?: string;
}

// Handle to a running agent
export interface AgentHandle {
  pid: number;
  workstreamId: string;
  kill: () => Promise<void>;
  sendInput: (input: string) => Promise<void>;
  wait: () => Promise<AgentOutput>;
}

// Options for spawning an agent
export interface SpawnOptions {
  workstream: Workstream;
  repoPath: string;
  agentType?: AgentType;
  onProgress?: (message: string) => void;
  onHITL?: (question: string) => void;
}

/**
 * Spawn an agent to work on a workstream
 */
export async function spawnAgent(options: SpawnOptions): Promise<AgentHandle> {
  const {
    workstream,
    repoPath,
    agentType = getDefaultAgentType(),
    onProgress,
    onHITL,
  } = options;

  // Create isolated worktree for this agent
  const worktreePath = await createWorktree(repoPath, workstream.id);

  // Build the agent command based on type
  const { command, args, env } = buildAgentCommand(agentType, {
    workstream,
    worktreePath,
  });

  // Spawn the agent process
  const childProcess = spawn(command, args, {
    cwd: worktreePath,
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let output = '';
  let filesCreated: string[] = [];
  let filesModified: string[] = [];

  // Handle stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    output += text;

    // Parse progress messages
    if (onProgress) {
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        onProgress(line);
      }
    }

    // Detect HITL requests (agent asking a question)
    if (onHITL && text.includes('HITL:')) {
      const match = text.match(/HITL:\s*(.+)/);
      if (match) {
        onHITL(match[1]);
      }
    }

    // Parse file changes
    const created = text.match(/Created:\s*(\S+)/g);
    if (created) {
      filesCreated.push(...created.map((m: string) => m.replace('Created:', '').trim()));
    }

    const modified = text.match(/Modified:\s*(\S+)/g);
    if (modified) {
      filesModified.push(...modified.map((m: string) => m.replace('Modified:', '').trim()));
    }
  });

  // Handle stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString();
    output += text;
    if (onProgress) {
      onProgress(`[stderr] ${text}`);
    }
  });

  // Create the handle
  const handle: AgentHandle = {
    pid: childProcess.pid || 0,
    workstreamId: workstream.id,

    kill: async () => {
      childProcess.kill('SIGTERM');
      await removeWorktree(repoPath, workstream.id);
    },

    sendInput: async (input: string) => {
      return new Promise<void>((resolve, reject) => {
        if (childProcess.stdin?.writable) {
          childProcess.stdin.write(input + '\n', (err: Error | null | undefined) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          reject(new Error('Agent stdin not writable'));
        }
      });
    },

    wait: () => {
      return new Promise<AgentOutput>((resolve, reject) => {
        childProcess.on('close', async (code: number | null) => {
          // Clean up worktree (but keep branch)
          try {
            await removeWorktree(repoPath, workstream.id);
          } catch (e) {
            console.error('Failed to remove worktree:', e);
          }

          if (code === 0) {
            resolve({
              summary: extractSummary(output),
              filesCreated: [...new Set(filesCreated)],
              filesModified: [...new Set(filesModified)],
            });
          } else {
            reject(new Error(`Agent exited with code ${code}: ${output.slice(-500)}`));
          }
        });

        childProcess.on('error', (err: Error) => {
          reject(err);
        });
      });
    },
  };

  return handle;
}

/**
 * Get the default agent type based on environment
 */
function getDefaultAgentType(): AgentType {
  if (process.env.FORGE_AGENT_TYPE) {
    return process.env.FORGE_AGENT_TYPE as AgentType;
  }

  // Check what's available
  try {
    const { execSync } = require('child_process');
    execSync('which claude', { stdio: 'ignore' });
    return 'claude-code';
  } catch {
    // Claude Code not found
  }

  // Fallback to mock for development
  return 'mock';
}

/**
 * Build the command for a specific agent type
 */
function buildAgentCommand(
  agentType: AgentType,
  options: { workstream: Workstream; worktreePath: string }
): { command: string; args: string[]; env: Record<string, string> } {
  const { workstream, worktreePath } = options;

  switch (agentType) {
    case 'claude-code':
      return {
        command: 'claude',
        args: [
          '--print',
          '--dangerously-skip-permissions',
          `--task`,
          buildClaudePrompt(workstream),
        ],
        env: {
          CLAUDE_CODE_ENTRYPOINT: worktreePath,
        },
      };

    case 'openhands':
      return {
        command: 'docker',
        args: [
          'run',
          '--rm',
          '-v',
          `${worktreePath}:/workspace`,
          '-e',
          `TASK=${workstream.prompt}`,
          'ghcr.io/all-hands-ai/openhands:latest',
        ],
        env: {},
      };

    case 'aider':
      return {
        command: 'aider',
        args: [
          '--yes',
          '--no-git',
          '--message',
          workstream.prompt,
        ],
        env: {},
      };

    case 'mock':
    default:
      return {
        command: 'node',
        args: ['-e', buildMockAgentScript(workstream)],
        env: {},
      };
  }
}

/**
 * Build the prompt for Claude Code
 */
function buildClaudePrompt(workstream: Workstream): string {
  return `
You are working on the "${workstream.name}" workstream.

YOUR OWNED FILES/DIRECTORIES:
${workstream.owns.map((p) => `- ${p}`).join('\n')}

YOUR TASK:
${workstream.prompt}

RULES:
1. Only create/modify files in your owned directories
2. Use TypeScript with strict types
3. Follow existing code style
4. Add appropriate error handling
5. When done, output a summary of changes

OUTPUT FORMAT:
- Start file creation with "Created: <filepath>"
- Start file modification with "Modified: <filepath>"
- If you need human input, prefix with "HITL: <question>"
`.trim();
}

/**
 * Build a mock agent script for testing
 */
function buildMockAgentScript(workstream: Workstream): string {
  return `
    const fs = require('fs');
    const path = require('path');

    console.log('Starting mock agent for: ${workstream.name}');
    console.log('Working on: ${workstream.prompt.slice(0, 100)}...');

    // Simulate work
    const files = ${JSON.stringify(workstream.owns)};

    setTimeout(() => {
      for (const file of files) {
        console.log('Created: ' + file + '/index.ts');
      }
      console.log('Agent completed successfully');
      process.exit(0);
    }, ${workstream.estimatedMinutes * 100}); // Speed up for mock
  `.trim();
}

/**
 * Extract a summary from agent output
 */
function extractSummary(output: string): string {
  // Look for summary markers
  const summaryMatch = output.match(/SUMMARY:?\s*([\s\S]+?)(?:$|---)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }

  // Otherwise, take the last meaningful lines
  const lines = output
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('[stderr]'))
    .slice(-10);

  return lines.join('\n');
}

/**
 * Check if an agent type is available
 */
export async function isAgentAvailable(agentType: AgentType): Promise<boolean> {
  const { execSync } = require('child_process');

  try {
    switch (agentType) {
      case 'claude-code':
        execSync('which claude', { stdio: 'ignore' });
        return true;

      case 'openhands':
        execSync('docker image inspect ghcr.io/all-hands-ai/openhands:latest', {
          stdio: 'ignore',
        });
        return true;

      case 'aider':
        execSync('which aider', { stdio: 'ignore' });
        return true;

      case 'mock':
        return true;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get available agent types
 */
export async function getAvailableAgents(): Promise<AgentType[]> {
  const types: AgentType[] = ['claude-code', 'openhands', 'aider', 'mock'];
  const available: AgentType[] = [];

  for (const type of types) {
    if (await isAgentAvailable(type)) {
      available.push(type);
    }
  }

  return available;
}
