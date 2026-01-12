# Agent Handoff Protocol

This document defines the communication and handoff protocols between agents in the multi-agent development workflow.

## Overview

Effective multi-agent collaboration requires clear interfaces, explicit contracts, and structured communication. This protocol ensures that agents can work independently while maintaining coherent integration.

## Communication Channels

### 1. Questions Tracker (`QUESTIONS.md`)

- For cross-agent questions and clarifications
- For dependency requests
- For reporting blockers

### 2. Handoff Protocol (this document)

- For interface definitions
- For API contracts
- For integration agreements

### 3. Sprint Document (`SPRINT-AFC-0.md`)

- For deliverable tracking
- For status updates
- For acceptance criteria

## Handoff Procedures

### Starting Work on a Deliverable

1. Check `SPRINT-AFC-0.md` for your assigned deliverables
2. Review `BOUNDARIES.md` to confirm path ownership
3. Check `QUESTIONS.md` for any pending questions from other agents
4. Update deliverable status to "In Progress"

### Completing a Deliverable

1. Ensure all code is committed to your agent branch
2. Update deliverable status to "Complete" in sprint document
3. Document any API contracts or interfaces below
4. Answer any pending questions related to your deliverable
5. Notify dependent agents via questions tracker if needed

### Requesting Dependencies

1. Post request in `QUESTIONS.md` with:
   - What you need
   - Why you need it
   - When you need it by
   - Suggested interface/contract
2. Tag the responsible agent
3. Track response and resolution

## Interface Contracts

### Database Schema (backend-db → all agents)

The database schema is the source of truth for data structures. All agents should:

- Reference `prisma/schema.prisma` for model definitions
- Use generated Prisma types in TypeScript
- Not create duplicate type definitions

**Contract:**

```typescript
// Available from @prisma/client after generation
import { Project, Run, Task, GitHubEvent } from '@prisma/client';
import { RunStatus, TaskStatus } from '@prisma/client';
```

### API Routes (backend-db → frontend-ui)

API contracts are defined in `SPRINT-AFC-0.md`. Frontend should:

- Use the documented request/response formats
- Handle error responses consistently
- Not assume undocumented fields

**Contract:**

```typescript
// Standard API response wrapper
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

// Standard error codes
type ErrorCode = 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
```

### Authentication (github-integration → all agents)

NextAuth provides session management. All agents should:

- Use `getServerSession()` for server-side auth
- Use `useSession()` for client-side auth
- Not implement custom auth logic

**Contract:**

```typescript
// Server-side (API routes, Server Components)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
// session.user.id - User's ID
// session.user.email - User's email
// session.accessToken - GitHub access token

// Client-side (Client Components)
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

### GitHub API Client (github-integration → backend-db)

The GitHub client provides repository and user data. Backend should:

- Import from `@/lib/github`
- Pass access token from session
- Handle rate limiting

**Contract:**

```typescript
import { GitHubClient } from '@/lib/github';

const client = new GitHubClient(accessToken);

// Available methods
await client.getUser(); // Get authenticated user
await client.getRepositories(); // Get user's repositories
await client.getRepository(owner, repo); // Get specific repo
```

### Webhook Events (github-integration → backend-db)

Webhook handler stores events. Backend provides storage API:

**Contract:**

```typescript
// github-integration calls this to store events
import { createGitHubEvent } from '@/lib/db/github-events';

await createGitHubEvent({
  projectId: string,
  eventType: string, // X-GitHub-Event header
  action: string | null, // payload.action if present
  payload: object, // Full webhook payload
});
```

### UI Components (frontend-ui → all agents)

Shared UI components are available from `@/components`:

**Contract:**

```typescript
// Layout components
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Sidebar } from '@/components/layout/Sidebar';

// Common components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
```

### Environment Variables (devops-compose → all agents)

Environment configuration is centralized:

**Contract:**

```typescript
// Available environment variables
process.env.DATABASE_URL; // PostgreSQL connection string
process.env.GITHUB_CLIENT_ID; // GitHub OAuth client ID
process.env.GITHUB_CLIENT_SECRET; // GitHub OAuth client secret
process.env.NEXTAUTH_SECRET; // Session encryption key
process.env.NEXTAUTH_URL; // Application URL
process.env.WEBHOOK_SECRET; // GitHub webhook secret (optional)
```

## Dependency Graph

```
devops-compose (infrastructure)
     │
     ├──► backend-db (schema, APIs)
     │         │
     │         └──► frontend-ui (pages, components)
     │
     └──► github-integration (auth, webhooks)
               │
               └──► backend-db (event storage)
               │
               └──► frontend-ui (session hooks)

qa-proof-docs ◄── all agents (tests, documentation)
```

## Conflict Resolution

### Code Conflicts

1. Primary owner of the file has final say
2. If no clear owner, orchestrator decides
3. Document decision in `QUESTIONS.md`

### Interface Conflicts

1. Provider (upstream) proposes interface
2. Consumer (downstream) reviews and requests changes
3. Both agree and document in this file
4. Changes to established contracts require both parties

### Timeline Conflicts

1. Dependent agent raises blocker in `QUESTIONS.md`
2. Blocking agent prioritizes or provides workaround
3. Orchestrator mediates if unresolved

## Checklist for Handoffs

### Provider Checklist

- [ ] Code is committed and pushed
- [ ] Interface is documented in HANDOFF-PROTOCOL.md
- [ ] Types are exported and accessible
- [ ] Basic usage example is provided
- [ ] Known limitations are documented
- [ ] Status updated in SPRINT-AFC-0.md

### Consumer Checklist

- [ ] Interface contract is understood
- [ ] Types are imported correctly
- [ ] Error handling is implemented
- [ ] Edge cases are considered
- [ ] Integration tested locally
