# Sprint AFC-1: Enhanced Multi-Agent Capabilities

## Sprint Overview

**Gate**: AFC-1 (Agent Factory Console - Gate 1)
**Objective**: Enhance the platform with proper agent tracking, authentication, and scalable APIs
**Status**: In Progress
**Predecessor**: AFC-0 (Proof of Life) - Completed

## Sprint Goals

The AFC-1 gate builds on the AFC-0 foundation to deliver:

1. **Agent Model** - First-class support for tracking AI agents in the system
2. **Authenticated APIs** - Session-based authentication for all API routes
3. **Scalable APIs** - Pagination, filtering, and sorting for list endpoints
4. **Dashboard Statistics** - Aggregate metrics for project health visibility
5. **Enhanced Task Management** - Priority, description, and better assignee tracking
6. **Repository API** - CRUD operations for tracked repositories

## Agent Deliverables

### Agent A: Backend & Database (`backend-db-api`)

| Deliverable                            | Status      | Notes                              |
| -------------------------------------- | ----------- | ---------------------------------- |
| Agent model in Prisma schema           | In Progress | Links to User, assignable to Tasks |
| AgentType enum (BACKEND, FRONTEND, etc)| Pending     | Match existing agent definitions   |
| Authentication middleware              | Pending     | Reusable across all API routes     |
| Paginated GET /api/projects            | Pending     | cursor-based pagination            |
| Paginated GET /api/runs                | Pending     | cursor-based pagination            |
| Paginated GET /api/tasks               | Pending     | cursor-based pagination            |
| GET /api/stats/dashboard               | Pending     | Aggregate statistics               |
| GET /api/repositories                  | Pending     | List tracked repositories          |
| POST /api/repositories                 | Pending     | Create/link repository             |
| Task priority field                    | Pending     | LOW, MEDIUM, HIGH, CRITICAL        |
| Task description field                 | Pending     | Optional longer description        |
| Task agent relation                    | Pending     | Replace string assignee            |
| Database migrations                    | Pending     | Generate after schema changes      |

### Agent B: Frontend & UI (`frontend-ui`)

| Deliverable                        | Status  | Notes                            |
| ---------------------------------- | ------- | -------------------------------- |
| Agent management page              | Pending | List/create/edit agents          |
| Dashboard statistics widgets       | Pending | Consume /api/stats/dashboard     |
| Pagination controls in list views  | Pending | Load more / infinite scroll      |
| Task priority badges               | Pending | Visual priority indicators       |
| Task detail panel                  | Pending | Show description, agent, etc.    |

### Agent C: GitHub Integration (`github-integration`)

| Deliverable                           | Status  | Notes                         |
| ------------------------------------- | ------- | ----------------------------- |
| Link Repository to Project            | Pending | Sync GitHub repo to Project   |
| Auto-create Agent from PR author      | Pending | Track contributors as agents  |
| Enhanced webhook event categorization | Pending | Better event filtering        |

### Agent D: DevOps & Infrastructure (`devops-compose`)

| Deliverable                      | Status  | Notes                    |
| -------------------------------- | ------- | ------------------------ |
| Database backup script           | Pending | PostgreSQL pg_dump       |
| Health check improvements        | Pending | Include DB connectivity  |
| Environment variable validation  | Pending | Fail fast on missing env |

### Agent E: QA & Documentation (`qa-proof-docs`)

| Deliverable                    | Status  | Notes                     |
| ------------------------------ | ------- | ------------------------- |
| API endpoint tests             | Pending | Jest tests for all routes |
| Authentication flow tests      | Pending | Test protected endpoints  |
| Updated API documentation      | Pending | OpenAPI/Swagger spec      |
| AFC-1 proof-of-life checklist  | Pending | Verification steps        |

## Data Model Specification

### Agent

```prisma
model Agent {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  name        String
  type        AgentType
  description String?
  avatarUrl   String?
  isActive    Boolean    @default(true)
  tasks       Task[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([userId, name])
}

enum AgentType {
  BACKEND
  FRONTEND
  GITHUB_INTEGRATION
  DEVOPS
  QA_DOCS
  ORCHESTRATOR
  CUSTOM
}
```

### Enhanced Task

```prisma
model Task {
  id          String       @id @default(cuid())
  runId       String
  run         Run          @relation(fields: [runId], references: [id], onDelete: Cascade)
  title       String
  description String?      @db.Text
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  agentId     String?
  agent       Agent?       @relation(fields: [agentId], references: [id])
  assignee    String?      // Keep for backwards compatibility
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

enum TaskStatus {
  TODO
  DOING
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

## API Specifications

### Authentication Middleware

All API routes (except webhooks and health) require authentication:

```typescript
// Middleware checks for valid session
// Returns 401 if not authenticated
// Attaches user to request context
```

### Pagination Response Format

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;  // Next cursor for pagination
    hasMore: boolean;
    total: number;
  };
}
```

### Dashboard Statistics API

```
GET /api/stats/dashboard
Response: {
  projects: {
    total: number;
    active: number;
  };
  runs: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  tasks: {
    total: number;
    byStatus: {
      TODO: number;
      DOING: number;
      DONE: number;
      BLOCKED: number;
    };
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
  };
  agents: {
    total: number;
    active: number;
  };
  recentActivity: GitHubEvent[];
}
```

### Agents API

```
GET /api/agents
Query: ?userId=xxx&type=xxx&isActive=true
Response: PaginatedResponse<Agent>

POST /api/agents
Body: { name: string, type: AgentType, description?: string, avatarUrl?: string }
Response: Agent

GET /api/agents/[id]
Response: Agent & { tasks: Task[] }

PATCH /api/agents/[id]
Body: { name?: string, type?: AgentType, description?: string, isActive?: boolean }
Response: Agent

DELETE /api/agents/[id]
Response: { success: true }
```

### Repositories API

```
GET /api/repositories
Query: ?cursor=xxx&limit=20
Response: PaginatedResponse<Repository>

POST /api/repositories
Body: { githubId: number, name: string, fullName: string, ... }
Response: Repository

GET /api/repositories/[id]
Response: Repository & { pullRequests: PullRequest[], issues: Issue[] }

DELETE /api/repositories/[id]
Response: { success: true }
```

## Definition of Done

All of the following must be true for AFC-1 to be considered complete:

- [ ] Agent model exists and can be CRUD'd via API
- [ ] All list APIs support pagination
- [ ] All mutating APIs require authentication
- [ ] Dashboard statistics endpoint returns accurate data
- [ ] Tasks can have priority and description
- [ ] Tasks can be assigned to Agents
- [ ] Repository API is functional
- [ ] All new endpoints have test coverage
- [ ] Documentation updated with new APIs
- [ ] No regression in AFC-0 functionality

## Dependencies

```
Agent A (Backend/DB) ──────┐
                          │
Agent C (GitHub) ─────────┼──> Agent B (Frontend)
                          │
Agent D (DevOps) ─────────┘
                          │
                          └──> Agent E (QA/Docs)
```

## Risks and Mitigations

| Risk                                | Impact | Mitigation                              |
| ----------------------------------- | ------ | --------------------------------------- |
| Breaking API changes                | High   | Version APIs or maintain compatibility  |
| Performance with pagination         | Medium | Add database indexes                    |
| Auth middleware blocking webhooks   | High   | Exclude webhook routes from middleware  |
| Migration data loss                 | High   | Test migrations on copy of prod data    |

## Notes and Decisions

- Using cursor-based pagination for better performance with large datasets
- Keeping `assignee` string field for backwards compatibility during transition
- Agent types match the 6 agents defined in `.claude/agents.json`
- Adding CUSTOM agent type for flexibility
- Using enums for TaskStatus and TaskPriority instead of strings
