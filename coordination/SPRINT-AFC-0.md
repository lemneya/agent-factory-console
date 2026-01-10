# Sprint AFC-0: Proof of Life

## Sprint Overview

**Gate**: AFC-0 (Agent Factory Console - Gate 0)
**Objective**: Establish foundational functionality and validate multi-agent development workflow
**Status**: In Progress

## Sprint Goals

The AFC-0 gate establishes the "proof of life" for the Agent Factory Console:

1. **Working Development Environment** - Docker Compose setup that starts the full stack
2. **Authentication** - GitHub OAuth login flow
3. **Core Data Model** - Database schema with all required tables
4. **Basic UI** - Dashboard with navigation and core pages
5. **GitHub Integration** - Webhook event capture and display
6. **Multi-Agent Coordination** - Validated workflow with clear boundaries

## Agent Deliverables

### DevOps & Infrastructure (`devops-compose`)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Docker Compose with app and postgres services | Pending | |
| Dockerfile for Next.js application | Pending | |
| Environment variable template (.env.example) | Pending | |
| Package.json with all dependencies | Pending | |
| TypeScript and Next.js configuration | Pending | |
| GitHub Actions workflow for CI | Pending | |

### Backend & Database (`backend-db`)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Prisma schema with Project model | Pending | |
| Prisma schema with Run model | Pending | |
| Prisma schema with Task model | Pending | |
| Prisma schema with GitHubEvent model | Pending | |
| Database migrations | Pending | |
| CRUD API for projects | Pending | |
| CRUD API for runs | Pending | |
| CRUD API for tasks | Pending | |
| Type definitions | Pending | |

### GitHub Integration (`github-integration`)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| NextAuth configuration with GitHub provider | Pending | |
| GitHub OAuth callback handling | Pending | |
| GitHub API client for repository fetching | Pending | |
| Webhook endpoint for receiving events | Pending | |
| Event storage to GitHubEvent table | Pending | |

### Frontend & UI (`frontend-ui`)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Dashboard layout with navigation sidebar | Pending | |
| Projects list page (/projects) | Pending | |
| Notifications feed page (/notifications) | Pending | |
| Runs list page (/runs) | Pending | |
| Task board page with Kanban (/runs/[id]) | Pending | |

### QA & Documentation (`qa-proof-docs`)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Comprehensive README.md | Complete | |
| Agent configuration (.claude/agents.json) | Complete | |
| Path ownership matrix (BOUNDARIES.md) | Complete | |
| Sprint documentation | Complete | This document |
| Handoff protocol | Complete | |
| Architecture documentation | Pending | |
| Test infrastructure setup | Pending | |
| Proof-of-life verification checklist | Pending | |

## Definition of Done

All of the following must be true for AFC-0 to be considered complete:

- [ ] App starts with `docker-compose up`
- [ ] GitHub OAuth login works
- [ ] User repositories appear on `/projects`
- [ ] Webhook events are stored and displayed on `/notifications`
- [ ] Can create/view runs on `/runs`
- [ ] Can create/view/move tasks on `/runs/[id]`
- [ ] All agent code merged to sprint branch
- [ ] Basic tests passing

## Data Model Specification

### Project
```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  repoName    String
  repoFullName String
  description String?
  htmlUrl     String
  lastUpdated DateTime
  createdAt   DateTime @default(now())

  runs        Run[]
  events      GitHubEvent[]
}
```

### Run
```prisma
model Run {
  id          String    @id @default(cuid())
  projectId   String
  name        String
  status      RunStatus @default(ACTIVE)
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  project     Project   @relation(fields: [projectId], references: [id])
  tasks       Task[]
}

enum RunStatus {
  ACTIVE
  COMPLETED
  FAILED
}
```

### Task
```prisma
model Task {
  id        String     @id @default(cuid())
  runId     String
  title     String
  status    TaskStatus @default(TODO)
  assignee  String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  run       Run        @relation(fields: [runId], references: [id])
}

enum TaskStatus {
  TODO
  DOING
  DONE
  BLOCKED
}
```

### GitHubEvent
```prisma
model GitHubEvent {
  id         String   @id @default(cuid())
  projectId  String
  eventType  String
  action     String?
  payload    Json
  receivedAt DateTime @default(now())

  project    Project  @relation(fields: [projectId], references: [id])
}
```

## Page Specifications

### Dashboard Layout (`/`)
- Sidebar navigation with links to all pages
- Header with user info and logout
- Main content area

### Projects Page (`/projects`)
- List of user's GitHub repositories
- Sync button to refresh from GitHub
- Click to view project details

### Notifications Page (`/notifications`)
- Chronological feed of GitHub events
- Event type and action displayed
- Timestamp and project association

### Runs Page (`/runs`)
- List of all runs across projects
- Status indicator (Active/Completed/Failed)
- Create new run button
- Click to view task board

### Task Board Page (`/runs/[id]`)
- Kanban board with 4 columns: TODO, DOING, DONE, BLOCKED
- Drag-and-drop task movement
- Add new task button
- Task cards with title and assignee

## API Specifications

### Projects API

```
GET /api/projects
Response: { projects: Project[] }

POST /api/projects
Body: { repoFullName: string }
Response: { project: Project }

GET /api/projects/[id]
Response: { project: Project }
```

### Runs API

```
GET /api/runs
Query: ?projectId=xxx (optional)
Response: { runs: Run[] }

POST /api/runs
Body: { projectId: string, name: string }
Response: { run: Run }

GET /api/runs/[id]
Response: { run: Run & { tasks: Task[] } }
```

### Tasks API

```
GET /api/tasks
Query: ?runId=xxx (optional)
Response: { tasks: Task[] }

POST /api/tasks
Body: { runId: string, title: string, assignee?: string }
Response: { task: Task }

PATCH /api/tasks/[id]
Body: { status?: TaskStatus, title?: string, assignee?: string }
Response: { task: Task }
```

### Webhooks API

```
POST /api/webhooks/github
Headers: X-GitHub-Event, X-Hub-Signature-256
Body: GitHub webhook payload
Response: { received: true }
```

## Timeline and Dependencies

```
Week 1:
├── devops-compose: Infrastructure setup
└── qa-proof-docs: Documentation foundation

Week 2:
├── backend-db: Schema and migrations (depends on devops-compose)
└── github-integration: Auth setup (depends on devops-compose)

Week 3:
├── backend-db: API routes
├── github-integration: Webhooks
└── frontend-ui: Layout and pages (depends on backend-db)

Week 4:
├── frontend-ui: Integration with APIs
├── qa-proof-docs: Test writing
└── orchestrator: Integration and merge
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Merge conflicts in shared files | Medium | Clear ownership in BOUNDARIES.md |
| API contract mismatches | High | Document specs in HANDOFF-PROTOCOL.md |
| Environment configuration issues | Medium | Comprehensive .env.example |
| Authentication flow complexity | Medium | Early testing with GitHub OAuth |

## Notes and Decisions

- Using Next.js App Router (not Pages Router)
- Prisma with PostgreSQL for database
- NextAuth for authentication (not custom JWT)
- Tailwind CSS for styling (no component library initially)
- Jest for unit tests, Playwright for E2E
