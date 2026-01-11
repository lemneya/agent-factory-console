import { prisma } from "@/lib/prisma";
import { createGitHubClient, fetchUserRepositories, GitHubRepository } from "./client";

// Sync all repositories for a user after OAuth login
export async function syncUserRepositories(
  userId: string,
  accessToken: string
): Promise<void> {
  const client = createGitHubClient(accessToken);

  console.log(`Starting repository sync for user ${userId}`);

  const repos = await fetchUserRepositories(client);

  console.log(`Found ${repos.length} repositories to sync`);

  // Batch upsert repositories
  for (const repo of repos) {
    await upsertRepository(repo);
  }

  console.log(`Repository sync complete for user ${userId}`);
}

async function upsertRepository(repo: GitHubRepository): Promise<void> {
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
}

// Manual sync trigger - can be called from an API endpoint
export async function triggerRepositorySync(userId: string): Promise<{ synced: number }> {
  // Get the user's GitHub access token
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "github",
    },
    select: {
      access_token: true,
    },
  });

  if (!account?.access_token) {
    throw new Error("No GitHub account linked");
  }

  const client = createGitHubClient(account.access_token);
  const repos = await fetchUserRepositories(client);

  for (const repo of repos) {
    await upsertRepository(repo);
  }

  return { synced: repos.length };
}

// Sync a single repository's details
export async function syncSingleRepository(
  userId: string,
  owner: string,
  repoName: string
): Promise<void> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "github",
    },
    select: {
      access_token: true,
    },
  });

  if (!account?.access_token) {
    throw new Error("No GitHub account linked");
  }

  const client = createGitHubClient(account.access_token);

  const response = await client.rest.repos.get({
    owner,
    repo: repoName,
  });

  await upsertRepository(response.data as GitHubRepository);
}
