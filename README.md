# Agent Factory Console

> Single pane of glass dashboard for multi-agent AI development - Project inventory, notifications feed, and run/task tracking

## Overview

Agent Factory Console (AFC) is a web-based dashboard that provides centralized management and visibility for multi-agent AI development workflows. It serves as the coordination hub for distributed AI agent teams working on software projects.

### Key Features

- **Project Inventory** - List and manage AI development projects linked to GitHub repositories
- **Notifications Feed** - Real-time GitHub events and activity tracking via webhooks
- **Run/Task Tracking** - Monitor and manage development runs with Kanban-style task boards
- **GitHub Integration** - OAuth authentication and webhook-based event processing
- **Multi-Agent Coordination** - Structured workflow for distributed AI agent development

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers, Prisma ORM |
| Database | PostgreSQL |
| Authentication | NextAuth with GitHub OAuth |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Testing | Jest (unit), Playwright (E2E) |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- GitHub OAuth App credentials
- Node.js 20+ (for local development without Docker)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/anthropics/agent-factory-console.git
   cd agent-factory-console
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GITHUB_CLIENT_ID` - GitHub OAuth App client ID
   - `GITHUB_CLIENT_SECRET` - GitHub OAuth App client secret
   - `NEXTAUTH_SECRET` - Random string for session encryption
   - `NEXTAUTH_URL` - Application URL (e.g., `http://localhost:3000`)

### Running with Docker

```bash
# Start all services (app + database)
docker-compose up

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`.

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## Project Structure

```
agent-factory-console/
├── .claude/                    # Agent configuration
│   └── agents.json            # Agent definitions and responsibilities
├── coordination/               # Multi-agent coordination docs
│   ├── SPRINT-AFC-0.md        # Current sprint goals
│   ├── HANDOFF-PROTOCOL.md    # Agent communication protocol
│   └── QUESTIONS.md           # Cross-agent issue tracker
├── docs/                       # Project documentation
│   └── architecture.md        # System architecture
├── prisma/                     # Database schema and migrations
│   └── schema.prisma          # Prisma schema definition
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── projects/      # Project inventory
│   │   │   ├── notifications/ # GitHub events feed
│   │   │   └── runs/          # Run and task management
│   │   └── api/               # API route handlers
│   │       ├── auth/          # NextAuth configuration
│   │       └── webhooks/      # GitHub webhook handlers
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── db/               # Database utilities
│   │   └── github/           # GitHub API client
│   ├── styles/               # Global styles
│   └── types/                # TypeScript type definitions
├── tests/                     # E2E tests (Playwright)
├── __tests__/                 # Unit tests (Jest)
├── scripts/                   # Development and build scripts
├── BOUNDARIES.md              # Agent path ownership matrix
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Application Dockerfile
└── package.json               # Node.js dependencies
```

## Multi-Agent Development Model

This project uses a collaborative multi-agent development approach with 6 specialized agents:

| Agent | Role | Responsibilities |
|-------|------|------------------|
| backend-db | Backend & Database | Prisma schema, migrations, API routes, server logic |
| frontend-ui | Frontend & UI | React components, pages, styling, client state |
| github-integration | GitHub Integration | OAuth, GitHub API, webhooks, event processing |
| devops-compose | DevOps & Infrastructure | Docker, CI/CD, environment config, scripts |
| qa-proof-docs | QA & Documentation | Tests, documentation, verification |
| orchestrator | Orchestrator | Coordination, merging, conflict resolution |

See [BOUNDARIES.md](./BOUNDARIES.md) for detailed path ownership and [coordination/](./coordination/) for sprint planning.

## Database Schema

The AFC-0 gate defines four core data models:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Project   │────<│     Run     │────<│    Task     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │
┌─────────────┐
│ GitHubEvent │
└─────────────┘
```

- **Project** - Represents a GitHub repository linked to the user
- **Run** - A development iteration or sprint within a project
- **Task** - Individual work items within a run (Kanban workflow)
- **GitHubEvent** - Webhook events received from GitHub

## API Endpoints

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create/sync a project
- `GET /api/projects/[id]` - Get project details

### Runs
- `GET /api/runs` - List all runs
- `POST /api/runs` - Create a new run
- `GET /api/runs/[id]` - Get run with tasks

### Tasks
- `GET /api/tasks` - List tasks (filterable by run)
- `POST /api/tasks` - Create a task
- `PATCH /api/tasks/[id]` - Update task status

### Webhooks
- `POST /api/webhooks/github` - GitHub webhook receiver

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## Development Gates

### AFC-0: Proof of Life (Current)

The initial gate establishes foundational functionality:

- [x] Project structure and documentation
- [ ] Database schema with 4 core tables
- [ ] Dashboard layout with navigation
- [ ] Project inventory page
- [ ] Runs and tasks pages with Kanban board
- [ ] GitHub OAuth authentication
- [ ] Webhook event storage and display
- [ ] Docker Compose development environment
- [ ] Basic test coverage

**Definition of Done:**
1. App starts with `docker-compose up`
2. GitHub OAuth login works
3. User repositories appear on `/projects`
4. Webhook events are stored and displayed
5. Can create/view runs and tasks
6. All agent code merged to sprint branch
7. Basic tests passing

## Contributing

This project follows a multi-agent development workflow. See the [coordination documentation](./coordination/) for contribution guidelines and the [BOUNDARIES.md](./BOUNDARIES.md) for code ownership.

## License

MIT License - see [LICENSE](./LICENSE) for details.
