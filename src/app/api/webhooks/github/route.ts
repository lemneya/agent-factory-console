import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/github/client';

// GitHub webhook event types we handle
type GitHubEventType = 'push' | 'pull_request' | 'issues';

interface WebhookPayload {
  action?: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    id: number;
    login: string;
    avatar_url: string;
  };
  ref?: string;
  pusher?: { name?: string };
  pull_request?: {
    id: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    user: { login: string; avatar_url: string };
    head: { ref: string };
    base: { ref: string };
    merged?: boolean;
    merged_at: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
  };
  number?: number;
  issue?: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    user: { login: string; avatar_url: string };
    labels?: Array<{ name: string }>;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    const eventType = request.headers.get('x-github-event') as GitHubEventType;
    const deliveryId = request.headers.get('x-github-delivery');

    // Only process events we care about
    if (!['push', 'pull_request', 'issues'].includes(eventType)) {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    // Find the repository in our database
    const repository = await prisma.repository.findFirst({
      where: {
        githubId: payload.repository.id,
      },
    });

    // Store the event
    await prisma.gitHubEvent.create({
      data: {
        deliveryId: deliveryId || undefined,
        eventType,
        action: payload.action || null,
        repositoryId: repository?.id || null,
        repositoryName: payload.repository.full_name,
        senderUsername: payload.sender.login,
        senderAvatarUrl: payload.sender.avatar_url,
        payload: JSON.parse(JSON.stringify(payload)),
      },
    });

    // Process specific event types
    switch (eventType) {
      case 'push':
        await handlePushEvent(payload, repository?.id);
        break;
      case 'pull_request':
        await handlePullRequestEvent(payload, repository?.id);
        break;
      case 'issues':
        await handleIssuesEvent(payload, repository?.id);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePushEvent(payload: WebhookPayload, repositoryId?: string) {
  const { ref, pusher } = payload;

  console.log(`Push to ${payload.repository.full_name} on ${ref} by ${pusher?.name || 'unknown'}`);

  // Update repository's last push timestamp if we track it
  if (repositoryId && ref) {
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        lastPushAt: new Date(),
        defaultBranch: ref.replace('refs/heads/', ''),
      },
    });
  }
}

async function handlePullRequestEvent(payload: WebhookPayload, repositoryId?: string) {
  const { action, pull_request, number } = payload;

  console.log(`Pull request #${number} ${action} on ${payload.repository.full_name}`);

  if (!repositoryId || !number) return;

  // Upsert pull request data
  if (pull_request) {
    await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId,
          number,
        },
      },
      create: {
        repositoryId,
        number,
        githubId: pull_request.id,
        title: pull_request.title,
        body: pull_request.body,
        state: pull_request.state,
        htmlUrl: pull_request.html_url,
        authorUsername: pull_request.user.login,
        authorAvatarUrl: pull_request.user.avatar_url,
        headRef: pull_request.head.ref,
        baseRef: pull_request.base.ref,
        merged: pull_request.merged || false,
        mergedAt: pull_request.merged_at ? new Date(pull_request.merged_at) : null,
        createdAt: new Date(pull_request.created_at),
        updatedAt: new Date(pull_request.updated_at),
        closedAt: pull_request.closed_at ? new Date(pull_request.closed_at) : null,
      },
      update: {
        title: pull_request.title,
        body: pull_request.body,
        state: pull_request.state,
        merged: pull_request.merged || false,
        mergedAt: pull_request.merged_at ? new Date(pull_request.merged_at) : null,
        updatedAt: new Date(pull_request.updated_at),
        closedAt: pull_request.closed_at ? new Date(pull_request.closed_at) : null,
      },
    });
  }
}

async function handleIssuesEvent(payload: WebhookPayload, repositoryId?: string) {
  const { action, issue } = payload;

  console.log(`Issue #${issue?.number} ${action} on ${payload.repository.full_name}`);

  if (!repositoryId || !issue) return;

  // Upsert issue data
  await prisma.issue.upsert({
    where: {
      repositoryId_number: {
        repositoryId,
        number: issue.number,
      },
    },
    create: {
      repositoryId,
      number: issue.number,
      githubId: issue.id,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      htmlUrl: issue.html_url,
      authorUsername: issue.user.login,
      authorAvatarUrl: issue.user.avatar_url,
      labels: issue.labels?.map(l => l.name) || [],
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
    },
    update: {
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels?.map(l => l.name) || [],
      updatedAt: new Date(issue.updated_at),
      closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
    },
  });
}
