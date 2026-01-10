import { Octokit } from "octokit";

// Create an authenticated Octokit client for a user
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

// Types for GitHub API responses
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  diff_url: string;
  patch_url: string;
  merged: boolean;
  merged_at: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

// Fetch all repositories for the authenticated user
export async function fetchUserRepositories(client: Octokit): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = [];

  for await (const response of client.paginate.iterator(
    client.rest.repos.listForAuthenticatedUser,
    {
      per_page: 100,
      sort: "updated",
      direction: "desc",
    }
  )) {
    repos.push(...(response.data as GitHubRepository[]));
  }

  return repos;
}

// Fetch issues for a repository
export async function fetchRepositoryIssues(
  client: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];

  for await (const response of client.paginate.iterator(
    client.rest.issues.listForRepo,
    {
      owner,
      repo,
      state,
      per_page: 100,
    }
  )) {
    // Filter out pull requests (GitHub API returns PRs in issues endpoint)
    const repoIssues = (response.data as GitHubIssue[]).filter(
      (issue: any) => !issue.pull_request
    );
    issues.push(...repoIssues);
  }

  return issues;
}

// Fetch pull requests for a repository
export async function fetchRepositoryPullRequests(
  client: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "all"
): Promise<GitHubPullRequest[]> {
  const pullRequests: GitHubPullRequest[] = [];

  for await (const response of client.paginate.iterator(
    client.rest.pulls.list,
    {
      owner,
      repo,
      state,
      per_page: 100,
    }
  )) {
    pullRequests.push(...(response.data as GitHubPullRequest[]));
  }

  return pullRequests;
}

// Fetch a single repository
export async function fetchRepository(
  client: Octokit,
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  const response = await client.rest.repos.get({
    owner,
    repo,
  });

  return response.data as GitHubRepository;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
