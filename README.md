# agent-factory-console

Single pane of glass dashboard for multi-agent AI development - Project inventory, notifications feed, and run/task tracking.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## API Routes

### Projects
- `GET /api/projects` - List all projects (optional: `?userId=`)
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project

### Runs
- `GET /api/runs` - List all runs (optional: `?projectId=`, `?status=`)
- `POST /api/runs` - Create a new run
- `GET /api/runs/[id]` - Get run details
- `PUT /api/runs/[id]` - Update a run
- `DELETE /api/runs/[id]` - Delete a run

### Tasks
- `GET /api/tasks` - List all tasks (optional: `?runId=`, `?status=`, `?assignee=`)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### GitHub Events
- `GET /api/github-events` - List events (optional: `?projectId=`, `?eventType=`, `?limit=`)
- `POST /api/github-events` - Create a new event
- `GET /api/github-events/[id]` - Get event details
- `DELETE /api/github-events/[id]` - Delete an event

## Database Schema

- **User**: Application users
- **Project**: GitHub repositories being tracked
- **Run**: Agent execution runs within a project
- **Task**: Individual tasks within a run
- **GitHubEvent**: Webhook events from GitHub
