# Sprint: AFC-0 Console Proof of Life

## Goal
Establish a working "proof of life" for the agent-factory-console - a functional dashboard that can:
1. Authenticate users via GitHub OAuth
2. Display their repositories
3. Show a notifications feed from GitHub webhooks
4. Track runs and tasks

## Sprint Branch
`feature/afc-0-console-proof-of-life`

## Agent Branches
| Agent | Branch | Status |
|-------|--------|--------|
| Backend & DB | `agent/backend-db` | Ready |
| Frontend & UI | `agent/frontend-ui` | Ready |
| GitHub Integration | `agent/github-integration` | Ready |
| DevOps | `agent/devops-compose` | Ready |
| QA & Docs | `agent/qa-proof-docs` | Ready |

---

## Deliverables by Agent

### backend-db
- [ ] Prisma schema with all 4 tables (Projects, Runs, Tasks, GitHubEvents)
- [ ] Database migrations
- [ ] CRUD operations for each model
- [ ] API routes: `/api/projects`, `/api/runs`, `/api/tasks`

### frontend-ui
- [ ] Dashboard layout with navigation
- [ ] `/projects` page - list view with cards
- [ ] `/runs` page - list view
- [ ] `/runs/[id]` page - Kanban-style task board
- [ ] `/notifications` page - event feed

### github-integration
- [ ] NextAuth GitHub provider setup
- [ ] GitHub API client for fetching repos
- [ ] Webhook endpoint `/api/webhooks/github`
- [ ] Event processing and storage

### devops-compose
- [ ] Docker Compose with Postgres + App
- [ ] `.env.example` with all required vars
- [ ] Development scripts
- [ ] Basic CI workflow

### qa-proof-docs
- [ ] README with setup instructions
- [ ] Basic smoke tests
- [ ] API documentation
- [ ] Proof of life checklist

---

## Definition of Done
- [ ] App starts with `docker-compose up`
- [ ] GitHub OAuth login works
- [ ] User's repos appear on `/projects`
- [ ] Webhook events stored and displayed
- [ ] Can create/view runs and tasks
- [ ] All agents' code merged to sprint branch
- [ ] Basic tests passing

---

## Timeline
Gate AFC-0 targets establishing the foundation. No orchestrator integration yet.

## Notes
- Use Next.js App Router conventions
- Prisma for all database operations
- Tailwind CSS for styling
- Keep it simple - proof of life, not production-ready
