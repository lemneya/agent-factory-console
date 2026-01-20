import { prisma } from '@/lib/prisma';
import { createGitHubClient, fetchUserRepositories, GitHubRepository } from './client';

export class GitHubSyncError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'GitHubSyncError';
  }
}

// Sync all repositories for a user after OAuth login
export async function syncUserRepositories(userId: string, accessToken: string): Promise<void> {
  try {
    const client = createGitHubClient(accessToken);

    console.log(`Starting repository sync for user ${userId}`);

    const repos = await fetchUserRepositories(client);

    console.log(`Found ${repos.length} repositories to sync`);

    // Batch upsert repositories
    for (const repo of repos) {
      await upsertRepository(repo);
    }

    console.log(`Repository sync complete for user ${userId}`);
  } catch (error) {
    if (error instanceof GitHubSyncError) throw error;
    throw new GitHubSyncError(
      `Failed to sync repositories for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'syncUserRepositories',
      error
    );
  }
}

async function upsertRepository(repo: GitHubRepository): Promise<void> {
  try {
    await prisma.repository.upsert({
      where: {
        githubId: repo.id,
      },
      create: {
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        lastPushAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      },
      update: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        lastPushAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      },
    });
  } catch (error) {
    throw new GitHubSyncError(
      `Failed to upsert repository ${repo.full_name} (ID: ${repo.id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      'upsertRepository',
      error
    );
  }
}

// Manual sync trigger - can be called from an API endpoint
export async function triggerRepositorySync(userId: string): Promise<{ synced: number }> {
  try {
    // Get the user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'github',
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      throw new GitHubSyncError(
        `No GitHub account linked for user ${userId}`,
        'triggerRepositorySync'
      );
    }

    const client = createGitHubClient(account.access_token);
    const repos = await fetchUserRepositories(client);

    for (const repo of repos) {
      await upsertRepository(repo);
    }

    return { synced: repos.length };
  } catch (error) {
    if (error instanceof GitHubSyncError) throw error;
    throw new GitHubSyncError(
      `Failed to trigger repository sync for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'triggerRepositorySync',
      error
    );
  }
}

// Sync a single repository's details
export async function syncSingleRepository(
  userId: string,
  owner: string,
  repoName: string
): Promise<void> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'github',
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      throw new GitHubSyncError(
        `No GitHub account linked for user ${userId}`,
        'syncSingleRepository'
      );
    }

    const client = createGitHubClient(account.access_token);

    const response = await client.rest.repos.get({
      owner,
      repo: repoName,
    });

    await upsertRepository(response.data as GitHubRepository);
  } catch (error) {
    if (error instanceof GitHubSyncError) throw error;
    throw new GitHubSyncError(
      `Failed to sync repository ${owner}/${repoName} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'syncSingleRepository',
      error
    );
  }
}
