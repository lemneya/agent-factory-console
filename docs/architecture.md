# System Architecture

This document describes the technical architecture of the Agent Factory Console.

## Overview

Agent Factory Console is a full-stack web application built with Next.js that provides a dashboard for managing multi-agent AI development workflows. The system integrates with GitHub for authentication and event tracking.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Application                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    App Router (Frontend)                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │   │
│  │  │ Layout  │  │Projects │  │  Runs   │  │Notifications│ │   │
│  │  │Dashboard│  │  Page   │  │  Page   │  │    Page     │ │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   API Routes (Backend)                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │   │
│  │  │  Auth   │  │Projects │  │  Runs   │  │  Webhooks   │ │   │
│  │  │NextAuth │  │  CRUD   │  │  CRUD   │  │   GitHub    │ │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Libraries & Utils                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ Prisma ORM  │  │GitHub Client│  │  Type Defs      │  │   │
│  │  │   (db/)     │  │  (github/)  │  │   (types/)      │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
│  │ Project │  │   Run   │  │  Task   │  │    GitHubEvent      │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│                          External Services                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         GitHub                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │    OAuth    │  │  REST API   │  │    Webhooks     │   │  │
│  │  │   Provider  │  │  (repos)    │  │   (events)      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Layer

The frontend uses Next.js App Router with React Server Components and Client Components.

```
src/app/
├── (dashboard)/           # Route group for dashboard pages
│   ├── layout.tsx        # Dashboard layout with sidebar
│   ├── page.tsx          # Dashboard home (redirects to /projects)
│   ├── projects/
│   │   └── page.tsx      # Projects list page
│   ├── notifications/
│   │   └── page.tsx      # GitHub events feed
│   └── runs/
│       ├── page.tsx      # Runs list page
│       └── [id]/
│           └── page.tsx  # Task board (Kanban)
├── api/                   # API route handlers
└── globals.css           # Global styles
```

**Key Patterns:**

- Server Components for data fetching
- Client Components for interactivity (marked with `'use client'`)
- Server Actions for mutations (optional)
- Suspense boundaries for loading states

### Component Library

```
src/components/
├── layout/
│   ├── DashboardLayout.tsx   # Main layout wrapper
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── Header.tsx            # Page header
├── ui/
│   ├── Button.tsx            # Button component
│   ├── Card.tsx              # Card container
│   ├── StatusBadge.tsx       # Status indicator
│   └── LoadingSpinner.tsx    # Loading state
├── projects/
│   └── ProjectCard.tsx       # Project display card
├── runs/
│   └── RunCard.tsx           # Run display card
└── tasks/
    ├── TaskBoard.tsx         # Kanban board
    ├── TaskColumn.tsx        # Kanban column
    └── TaskCard.tsx          # Task card
```

### API Layer

API routes follow RESTful conventions with consistent response formats.

```
src/app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts      # NextAuth configuration
├── projects/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (read), PATCH (update), DELETE
├── runs/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET (read with tasks)
├── tasks/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # PATCH (update status)
└── webhooks/
    └── github/
        └── route.ts      # POST (receive GitHub events)
```

**API Response Format:**

```typescript
// Success response
{
  data: T
}

// Error response
{
  error: {
    message: string,
    code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR'
  }
}
```

### Data Access Layer

Prisma ORM provides type-safe database access.

```
src/lib/db/
├── client.ts             # Prisma client singleton
├── projects.ts           # Project queries
├── runs.ts               # Run queries
├── tasks.ts              # Task queries
└── github-events.ts      # GitHubEvent queries
```

**Query Pattern:**

```typescript
// src/lib/db/projects.ts
import { prisma } from './client';

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { lastUpdated: 'desc' },
  });
}

export async function createProject(data: CreateProjectInput) {
  return prisma.project.create({ data });
}
```

### GitHub Integration Layer

```
src/lib/github/
├── client.ts             # GitHub API client class
├── types.ts              # GitHub API types
└── webhooks.ts           # Webhook verification
```

**Client Pattern:**

```typescript
// src/lib/github/client.ts
export class GitHubClient {
  constructor(private accessToken: string) {}

  async getUser() {
    return this.fetch('/user');
  }

  async getRepositories() {
    return this.fetch('/user/repos');
  }

  private async fetch(path: string) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.json();
  }
}
```

## Data Flow

### Authentication Flow

```
┌──────┐     ┌───────────┐     ┌────────┐     ┌──────────┐
│Client│────►│ NextAuth  │────►│ GitHub │────►│ Callback │
└──────┘     └───────────┘     │ OAuth  │     └──────────┘
                               └────────┘           │
                                                    ▼
┌──────┐     ┌───────────┐                   ┌──────────┐
│Client│◄────│  Session  │◄──────────────────│  Token   │
│      │     │  Cookie   │                   │  Store   │
└──────┘     └───────────┘                   └──────────┘
```

1. User clicks "Sign in with GitHub"
2. NextAuth redirects to GitHub OAuth
3. User authorizes the application
4. GitHub redirects back with auth code
5. NextAuth exchanges code for access token
6. Session cookie is set with user info

### Data Fetch Flow (Server Component)

```
┌──────────────┐     ┌───────────┐     ┌────────┐
│   Server     │────►│  Prisma   │────►│  DB    │
│  Component   │     │  Query    │     │        │
└──────────────┘     └───────────┘     └────────┘
       │
       ▼
┌──────────────┐
│    HTML      │
│   Response   │
└──────────────┘
```

### Data Mutation Flow (Client Component)

```
┌──────────────┐     ┌───────────┐     ┌────────┐     ┌──────┐
│   Client     │────►│   API     │────►│ Prisma │────►│  DB  │
│  Component   │     │  Route    │     │ Query  │     │      │
└──────────────┘     └───────────┘     └────────┘     └──────┘
       │                   │
       │◄──────────────────┘
       │         JSON Response
       ▼
┌──────────────┐
│   Update     │
│    State     │
└──────────────┘
```

### Webhook Flow

```
┌────────┐     ┌───────────────┐     ┌──────────────┐
│ GitHub │────►│ POST /api/    │────►│   Verify     │
│ Event  │     │ webhooks/     │     │  Signature   │
└────────┘     │ github        │     └──────────────┘
               └───────────────┘            │
                                            ▼
               ┌───────────────┐     ┌──────────────┐
               │     Store     │◄────│    Parse     │
               │   GitHubEvent │     │   Payload    │
               └───────────────┘     └──────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          Project                             │
├─────────────────────────────────────────────────────────────┤
│ id: String (PK)                                             │
│ userId: String                                              │
│ repoName: String                                            │
│ repoFullName: String                                        │
│ description: String?                                        │
│ htmlUrl: String                                             │
│ lastUpdated: DateTime                                       │
│ createdAt: DateTime                                         │
└─────────────────────────────────────────────────────────────┘
                    │                      │
                    │ 1:N                  │ 1:N
                    ▼                      ▼
┌────────────────────────────┐  ┌─────────────────────────────┐
│           Run              │  │       GitHubEvent           │
├────────────────────────────┤  ├─────────────────────────────┤
│ id: String (PK)            │  │ id: String (PK)             │
│ projectId: String (FK)     │  │ projectId: String (FK)      │
│ name: String               │  │ eventType: String           │
│ status: RunStatus          │  │ action: String?             │
│ createdAt: DateTime        │  │ payload: Json               │
│ completedAt: DateTime?     │  │ receivedAt: DateTime        │
└────────────────────────────┘  └─────────────────────────────┘
            │
            │ 1:N
            ▼
┌────────────────────────────┐
│           Task             │
├────────────────────────────┤
│ id: String (PK)            │
│ runId: String (FK)         │
│ title: String              │
│ status: TaskStatus         │
│ assignee: String?          │
│ createdAt: DateTime        │
│ updatedAt: DateTime        │
└────────────────────────────┘

Enums:
- RunStatus: ACTIVE | COMPLETED | FAILED
- TaskStatus: TODO | DOING | DONE | BLOCKED
```

## Security Architecture

### Authentication

- GitHub OAuth via NextAuth
- JWT session tokens (encrypted)
- CSRF protection built into NextAuth

### Authorization

- All API routes verify session
- User can only access their own projects
- Webhook signature verification for GitHub events

### Data Protection

- Environment variables for secrets
- Database connection via SSL in production
- No sensitive data in client-side code

## Deployment Architecture

### Development (Docker Compose)

```
┌─────────────────────────────────────┐
│           Docker Network            │
│  ┌─────────────┐  ┌─────────────┐  │
│  │     app     │  │   postgres  │  │
│  │  Next.js    │─►│  Database   │  │
│  │  Port 3000  │  │  Port 5432  │  │
│  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────┘
```

### Production (Recommended)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────►│   Railway    │────►│   GitHub     │
│  (Next.js)   │     │ (PostgreSQL) │     │  (Webhooks)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Performance Considerations

### Database

- Indexed foreign keys
- Connection pooling via Prisma
- Pagination for list endpoints

### Frontend

- Server Components for initial load
- React Suspense for streaming
- Optimistic updates for task moves

### Caching

- NextAuth session caching
- Static page generation where possible
- API response caching (future)

## Monitoring and Observability

### Logging

- Structured logging in API routes
- Error boundary logging in frontend
- Webhook event logging

### Metrics (Future)

- Request latency
- Error rates
- GitHub API rate limits

## Extensibility Points

### Adding New Data Models

1. Add to Prisma schema
2. Create migration
3. Add to `src/lib/db/`
4. Add API routes
5. Add UI components

### Adding New GitHub Events

1. Update webhook handler
2. Store new event type
3. Update notifications display

### Adding New Pages

1. Create page in `src/app/(dashboard)/`
2. Add navigation link in Sidebar
3. Create required components
