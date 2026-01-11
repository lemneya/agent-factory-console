import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGitHubClient, fetchUserRepositories } from '@/lib/github/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    // Verify the user is syncing their own repositories
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      return NextResponse.json({ error: 'No GitHub account linked' }, { status: 400 });
    }

    // Fetch repositories from GitHub
    const client = createGitHubClient(account.access_token);
    const repos = await fetchUserRepositories(client);

    // Create or update projects for each repository
    const syncedProjects = [];
    for (const repo of repos) {
      const project = await prisma.project.upsert({
        where: {
          id: `${userId}-${repo.full_name}`,
        },
        create: {
          id: `${userId}-${repo.full_name}`,
          userId,
          repoName: repo.name,
          repoFullName: repo.full_name,
          description: repo.description,
          htmlUrl: repo.html_url,
          lastUpdated: repo.pushed_at ? new Date(repo.pushed_at) : new Date(),
        },
        update: {
          repoName: repo.name,
          description: repo.description,
          htmlUrl: repo.html_url,
          lastUpdated: repo.pushed_at ? new Date(repo.pushed_at) : new Date(),
        },
      });
      syncedProjects.push(project);
    }

    return NextResponse.json({
      synced: syncedProjects.length,
      projects: syncedProjects,
    });
  } catch (error) {
    console.error('Error syncing repositories:', error);
    return NextResponse.json({ error: 'Failed to sync repositories' }, { status: 500 });
  }
}
