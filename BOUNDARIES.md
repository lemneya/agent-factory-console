# Agent Boundaries - AFC-0 Console Proof of Life

## Overview
This document defines path ownership for each agent role in the agent-factory-console project.
Each agent should only modify files within their designated paths unless coordinating with the Orchestrator.

---

## Path Ownership Matrix

### Backend & Database Agent (`agent/backend-db`)
**Owner:** backend-db

| Path | Description |
|------|-------------|
| `prisma/` | Prisma schema and migrations |
| `src/app/api/**` | API route handlers (except auth/webhooks) |
| `src/lib/db/` | Database utilities and queries |
| `src/types/` | TypeScript type definitions |

**Key Files:**
- `prisma/schema.prisma` - Database schema
- `src/lib/db/client.ts` - Prisma client instance
- `src/types/models.ts` - Shared type definitions

---

### Frontend & UI Agent (`agent/frontend-ui`)
**Owner:** frontend-ui

| Path | Description |
|------|-------------|
| `src/app/(dashboard)/` | Dashboard pages and layouts |
| `src/components/` | React components |
| `src/hooks/` | Custom React hooks |
| `src/styles/` | CSS and styling |

**Key Files:**
- `src/app/(dashboard)/layout.tsx` - Dashboard layout
- `src/app/(dashboard)/projects/page.tsx` - Projects list
- `src/app/(dashboard)/runs/page.tsx` - Runs list
- `src/app/(dashboard)/runs/[id]/page.tsx` - Task board
- `src/app/(dashboard)/notifications/page.tsx` - Events feed

---

### GitHub Integration Agent (`agent/github-integration`)
**Owner:** github-integration

| Path | Description |
|------|-------------|
| `src/lib/github/` | GitHub API client and utilities |
| `src/app/api/webhooks/` | Webhook endpoint handlers |
| `src/app/api/auth/` | Auth configuration (NextAuth) |

**Key Files:**
- `src/lib/github/client.ts` - GitHub API client
- `src/lib/github/repos.ts` - Repository operations
- `src/app/api/webhooks/github/route.ts` - Webhook handler
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth config

---

### DevOps & Infrastructure Agent (`agent/devops-compose`)
**Owner:** devops-compose

| Path | Description |
|------|-------------|
| `docker-compose.yml` | Docker Compose configuration |
| `Dockerfile` | Application Dockerfile |
| `.env.example` | Environment template |
| `scripts/` | Development and build scripts |
| `.github/` | GitHub Actions workflows |

**Key Files:**
- `docker-compose.yml` - Local dev environment
- `.env.example` - Required environment variables
- `scripts/dev.sh` - Development startup script

---

### QA & Documentation Agent (`agent/qa-proof-docs`)
**Owner:** qa-proof-docs

| Path | Description |
|------|-------------|
| `tests/` | E2E and integration tests |
| `__tests__/` | Unit tests |
| `docs/` | Documentation |
| `*.md` | Markdown files (root level) |

**Key Files:**
- `README.md` - Project documentation
- `docs/SETUP.md` - Setup instructions
- `docs/API.md` - API documentation

---

## Shared Resources (Requires Coordination)

These files may be touched by multiple agents and require Orchestrator approval:

| File | Primary Owner | Secondary |
|------|--------------|-----------|
| `package.json` | devops-compose | all |
| `tsconfig.json` | devops-compose | backend-db |
| `next.config.js` | devops-compose | frontend-ui |
| `tailwind.config.js` | frontend-ui | devops-compose |

---

## Conflict Resolution Protocol

1. **Check boundaries first** - Before modifying a file, verify ownership
2. **Coordinate via Orchestrator** - For shared files, request approval
3. **Document changes** - Add comments in PRs explaining cross-boundary needs
4. **Merge through sprint branch** - All agent branches merge to `feature/afc-0-console-proof-of-life`

---

## Data Models Reference (AFC-0)

### PROJECTS
```
id, userId, repoName, repoFullName, description, htmlUrl, lastUpdated, createdAt
```

### RUNS
```
id, projectId, name, status (ACTIVE/COMPLETED/FAILED), createdAt, completedAt
```

### TASKS
```
id, runId, title, status (TODO/DOING/DONE/BLOCKED), assignee, createdAt, updatedAt
```

### GITHUB_EVENTS
```
id, projectId, eventType, action, payload (jsonb), receivedAt
```

---

## Pages Reference (AFC-0)

- `/projects` - Project Inventory list
- `/notifications` - GitHub events feed
- `/runs` - List of runs
- `/runs/[id]` - Task board for a specific run
