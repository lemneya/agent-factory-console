/**
 * ForgeAI - Branch Merger
 * Merges all agent branches into a single result branch
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MergeResult {
  success: boolean;
  branch: string;
  conflicts?: MergeConflict[];
  commits: string[];
}

export interface MergeConflict {
  file: string;
  ours: string;
  theirs: string;
  resolution?: string;
}

/**
 * Merge multiple agent branches into a single branch
 */
export async function mergeAgentBranches(
  repoPath: string,
  branches: string[],
  targetBranch = 'forge/merged'
): Promise<string> {
  // Create target branch from main
  try {
    await execAsync(`git branch -D ${targetBranch}`, { cwd: repoPath });
  } catch {
    // Branch might not exist
  }

  await execAsync(`git checkout -b ${targetBranch} main`, { cwd: repoPath });

  const mergedBranches: string[] = [];
  const conflicts: MergeConflict[] = [];

  // Merge each branch
  for (const branch of branches) {
    try {
      // Try standard merge
      await execAsync(`git merge ${branch} --no-edit -m "Merge ${branch}"`, {
        cwd: repoPath,
      });
      mergedBranches.push(branch);
    } catch (error) {
      // Check if it's a conflict
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: repoPath,
      });

      if (status.includes('UU ') || status.includes('AA ')) {
        // There are conflicts - attempt auto-resolution
        const conflictFiles = status
          .split('\n')
          .filter((l) => l.startsWith('UU ') || l.startsWith('AA '))
          .map((l) => l.slice(3).trim());

        for (const file of conflictFiles) {
          const resolved = await tryAutoResolve(repoPath, file, branch);
          if (!resolved) {
            conflicts.push({
              file,
              ours: 'current',
              theirs: branch,
            });
          }
        }

        // If all conflicts resolved, continue
        if (conflicts.length === 0) {
          await execAsync('git add -A', { cwd: repoPath });
          await execAsync(`git commit -m "Merge ${branch} (auto-resolved)"`, {
            cwd: repoPath,
          });
          mergedBranches.push(branch);
        } else {
          // Abort this merge
          await execAsync('git merge --abort', { cwd: repoPath });
          throw new Error(
            `Unresolvable conflicts merging ${branch}: ${conflicts.map((c) => c.file).join(', ')}`
          );
        }
      } else {
        // Some other error
        throw error;
      }
    }
  }

  // Return to the target branch
  await execAsync(`git checkout ${targetBranch}`, { cwd: repoPath });

  return targetBranch;
}

/**
 * Try to auto-resolve a merge conflict
 */
async function tryAutoResolve(
  repoPath: string,
  file: string,
  incomingBranch: string
): Promise<boolean> {
  try {
    // Strategy 1: If the file is in different directories owned by different agents,
    // we should never have conflicts (each agent has its own space)

    // Strategy 2: For shared files (like package.json, tsconfig), use theirs and merge
    if (isConfigFile(file)) {
      await execAsync(`git checkout --theirs "${file}"`, { cwd: repoPath });
      await execAsync(`git add "${file}"`, { cwd: repoPath });
      return true;
    }

    // Strategy 3: For code files, prefer the incoming (agent) changes
    // since agents are working on isolated features
    await execAsync(`git checkout --theirs "${file}"`, { cwd: repoPath });
    await execAsync(`git add "${file}"`, { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file is a config file that should be merged specially
 */
function isConfigFile(file: string): boolean {
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'tailwind.config',
    'next.config',
    'prisma/schema.prisma',
    '.env.example',
  ];

  return configFiles.some((cf) => file.includes(cf));
}

// Type for package.json structure
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Merge package.json files intelligently
 */
export async function mergePackageJson(
  base: PackageJson,
  incoming: PackageJson
): Promise<PackageJson> {
  const merged: PackageJson = { ...base };

  // Merge dependencies
  const depKeys: (keyof PackageJson)[] = ['dependencies', 'devDependencies', 'peerDependencies'];
  for (const key of depKeys) {
    if (incoming[key]) {
      merged[key] = {
        ...((base[key] as Record<string, string>) || {}),
        ...((incoming[key] as Record<string, string>) || {}),
      };
    }
  }

  // Merge scripts
  if (incoming.scripts) {
    merged.scripts = {
      ...(base.scripts || {}),
      ...(incoming.scripts || {}),
    };
  }

  return merged;
}

/**
 * Create a PR from the merged branch
 */
export async function createPullRequest(
  repoPath: string,
  branch: string,
  title: string,
  body: string
): Promise<string> {
  // Push the branch
  await execAsync(`git push -u origin ${branch}`, { cwd: repoPath });

  // Create PR using gh CLI
  try {
    const { stdout } = await execAsync(
      `gh pr create --title "${title}" --body "${body}" --head ${branch}`,
      { cwd: repoPath }
    );

    // Extract PR URL from output
    const urlMatch = stdout.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
    return urlMatch ? urlMatch[0] : stdout.trim();
  } catch (error) {
    // gh CLI might not be available
    console.warn('gh CLI not available, returning branch name');
    return branch;
  }
}

/**
 * Run post-merge validation
 */
export async function validateMerge(repoPath: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check TypeScript
  try {
    await execAsync('npm run typecheck', { cwd: repoPath });
  } catch (error) {
    errors.push('TypeScript errors detected');
  }

  // Check lint
  try {
    await execAsync('npm run lint', { cwd: repoPath });
  } catch (error) {
    errors.push('Lint errors detected');
  }

  // Check build
  try {
    await execAsync('npm run build', { cwd: repoPath });
  } catch (error) {
    errors.push('Build failed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a summary of all changes
 */
export async function generateMergeSummary(
  repoPath: string,
  branches: string[],
  baseBranch = 'main'
): Promise<string> {
  const sections: string[] = [];

  sections.push('# Forge Build Summary\n');

  for (const branch of branches) {
    try {
      const { stdout: diffStat } = await execAsync(
        `git diff ${baseBranch}...${branch} --stat`,
        { cwd: repoPath }
      );

      const { stdout: log } = await execAsync(
        `git log ${baseBranch}..${branch} --oneline`,
        { cwd: repoPath }
      );

      sections.push(`## ${branch}\n`);
      sections.push('### Commits\n```\n' + log + '\n```\n');
      sections.push('### Files Changed\n```\n' + diffStat + '\n```\n');
    } catch {
      sections.push(`## ${branch}\n(no changes)\n`);
    }
  }

  return sections.join('\n');
}
