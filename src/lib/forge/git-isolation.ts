/**
 * ForgeAI - Git Isolation
 * Uses git worktrees to isolate each agent's work
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

const WORKTREE_DIR = '.forge-worktrees';

/**
 * Create an isolated worktree for an agent
 */
export async function createWorktree(
  repoPath: string,
  workstreamId: string
): Promise<string> {
  const worktreeBase = path.join(repoPath, '..', WORKTREE_DIR);
  const worktreePath = path.join(worktreeBase, workstreamId);
  const branchName = `agent/${workstreamId}`;

  // Ensure worktree directory exists
  await fs.mkdir(worktreeBase, { recursive: true });

  // Check if worktree already exists
  try {
    await fs.access(worktreePath);
    // Worktree exists, remove it first
    await removeWorktree(repoPath, workstreamId);
  } catch {
    // Worktree doesn't exist, good
  }

  // Create branch if it doesn't exist
  try {
    await execAsync(`git branch ${branchName}`, { cwd: repoPath });
  } catch {
    // Branch might already exist, that's fine
  }

  // Create worktree
  await execAsync(`git worktree add "${worktreePath}" ${branchName}`, {
    cwd: repoPath,
  });

  return worktreePath;
}

/**
 * Remove a worktree (but keep the branch)
 */
export async function removeWorktree(
  repoPath: string,
  workstreamId: string
): Promise<void> {
  const worktreeBase = path.join(repoPath, '..', WORKTREE_DIR);
  const worktreePath = path.join(worktreeBase, workstreamId);

  try {
    // Remove the worktree
    await execAsync(`git worktree remove "${worktreePath}" --force`, {
      cwd: repoPath,
    });
  } catch (error) {
    // Try manual cleanup if git command fails
    try {
      await fs.rm(worktreePath, { recursive: true, force: true });
      await execAsync('git worktree prune', { cwd: repoPath });
    } catch {
      // Best effort cleanup
    }
  }
}

/**
 * List all active worktrees
 */
export async function listWorktrees(
  repoPath: string
): Promise<{ path: string; branch: string; head: string }[]> {
  const { stdout } = await execAsync('git worktree list --porcelain', {
    cwd: repoPath,
  });

  const worktrees: { path: string; branch: string; head: string }[] = [];
  let current: { path?: string; branch?: string; head?: string } = {};

  for (const line of stdout.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.path = line.replace('worktree ', '');
    } else if (line.startsWith('HEAD ')) {
      current.head = line.replace('HEAD ', '');
    } else if (line.startsWith('branch ')) {
      current.branch = line.replace('branch refs/heads/', '');
    } else if (line === '') {
      if (current.path && current.branch && current.head) {
        worktrees.push({
          path: current.path,
          branch: current.branch,
          head: current.head,
        });
      }
      current = {};
    }
  }

  return worktrees;
}

/**
 * Commit changes in a worktree
 */
export async function commitWorktree(
  worktreePath: string,
  message: string
): Promise<string> {
  // Stage all changes
  await execAsync('git add -A', { cwd: worktreePath });

  // Check if there are changes to commit
  try {
    await execAsync('git diff --cached --quiet', { cwd: worktreePath });
    // No changes
    return '';
  } catch {
    // There are changes, proceed with commit
  }

  // Commit
  const { stdout } = await execAsync(`git commit -m "${message}"`, {
    cwd: worktreePath,
  });

  // Get the commit hash
  const { stdout: hash } = await execAsync('git rev-parse HEAD', {
    cwd: worktreePath,
  });

  return hash.trim();
}

/**
 * Push a worktree's branch to remote
 */
export async function pushWorktree(
  worktreePath: string,
  remote = 'origin'
): Promise<void> {
  const { stdout: branch } = await execAsync('git branch --show-current', {
    cwd: worktreePath,
  });

  await execAsync(`git push -u ${remote} ${branch.trim()}`, {
    cwd: worktreePath,
  });
}

/**
 * Clean up all forge worktrees
 */
export async function cleanupAllWorktrees(repoPath: string): Promise<void> {
  const worktreeBase = path.join(repoPath, '..', WORKTREE_DIR);

  try {
    // List all worktrees
    const worktrees = await listWorktrees(repoPath);

    // Remove each forge worktree
    for (const wt of worktrees) {
      if (wt.path.includes(WORKTREE_DIR)) {
        try {
          await execAsync(`git worktree remove "${wt.path}" --force`, {
            cwd: repoPath,
          });
        } catch {
          // Best effort
        }
      }
    }

    // Prune stale worktree references
    await execAsync('git worktree prune', { cwd: repoPath });

    // Remove the worktree directory
    await fs.rm(worktreeBase, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
}

/**
 * Get the diff for a worktree branch compared to main
 */
export async function getWorktreeDiff(
  repoPath: string,
  workstreamId: string,
  baseBranch = 'main'
): Promise<string> {
  const branchName = `agent/${workstreamId}`;

  try {
    const { stdout } = await execAsync(
      `git diff ${baseBranch}...${branchName} --stat`,
      { cwd: repoPath }
    );
    return stdout;
  } catch {
    return '';
  }
}

/**
 * Check if a worktree has uncommitted changes
 */
export async function hasUncommittedChanges(worktreePath: string): Promise<boolean> {
  try {
    await execAsync('git diff --quiet && git diff --cached --quiet', {
      cwd: worktreePath,
    });
    return false;
  } catch {
    return true;
  }
}
