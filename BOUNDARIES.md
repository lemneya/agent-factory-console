# Agent Boundaries and Path Ownership

This document defines the code ownership boundaries for each agent in the multi-agent development workflow. Agents should only modify files within their owned paths unless coordinating with the path owner.

## Path Ownership Matrix

### Backend & Database Agent (`backend-db`)

| Path               | Type  | Description                    |
| ------------------ | ----- | ------------------------------ |
| `prisma/`          | Owned | Database schema and migrations |
| `src/app/api/**/*` | Owned | API route handlers             |
| `src/lib/db/`      | Owned | Database utilities and queries |
| `src/types/`       | Owned | TypeScript type definitions    |

**Exclusions:**

- `src/app/api/auth/` - Owned by github-integration
- `src/app/api/webhooks/` - Owned by github-integration

---

### Frontend & UI Agent (`frontend-ui`)

| Path                   | Type  | Description                 |
| ---------------------- | ----- | --------------------------- |
| `src/app/(dashboard)/` | Owned | Dashboard pages and layouts |
| `src/components/`      | Owned | React components            |
| `src/hooks/`           | Owned | Custom React hooks          |
| `src/styles/`          | Owned | CSS and styling             |

---

### GitHub Integration Agent (`github-integration`)

| Path                    | Type  | Description                     |
| ----------------------- | ----- | ------------------------------- |
| `src/lib/github/`       | Owned | GitHub API client and utilities |
| `src/app/api/webhooks/` | Owned | Webhook endpoint handlers       |
| `src/app/api/auth/`     | Owned | NextAuth configuration          |

---

### DevOps & Infrastructure Agent (`devops-compose`)

| Path                 | Type      | Description                      |
| -------------------- | --------- | -------------------------------- |
| `docker-compose.yml` | Owned     | Docker Compose configuration     |
| `Dockerfile`         | Owned     | Application Dockerfile           |
| `.env.example`       | Owned     | Environment variable template    |
| `scripts/`           | Owned     | Development and build scripts    |
| `.github/`           | Owned     | GitHub Actions workflows         |
| `package.json`       | Primary   | Node.js dependencies and scripts |
| `tsconfig.json`      | Primary   | TypeScript configuration         |
| `next.config.js`     | Primary   | Next.js configuration            |
| `tailwind.config.js` | Secondary | Tailwind CSS configuration       |
| `postcss.config.js`  | Owned     | PostCSS configuration            |

---

### QA & Documentation Agent (`qa-proof-docs`)

| Path                   | Type  | Description                  |
| ---------------------- | ----- | ---------------------------- |
| `tests/`               | Owned | E2E tests (Playwright)       |
| `__tests__/`           | Owned | Unit tests (Jest)            |
| `docs/`                | Owned | Project documentation        |
| `*.md` (root)          | Owned | Markdown files at root level |
| `jest.config.js`       | Owned | Jest configuration           |
| `playwright.config.ts` | Owned | Playwright configuration     |
| `.claude/`             | Owned | Agent configuration          |

---

### Orchestrator Agent (`orchestrator`)

| Path            | Type  | Description                      |
| --------------- | ----- | -------------------------------- |
| `coordination/` | Owned | Sprint and handoff documentation |

---

## Shared Resources

These files may be modified by multiple agents and require coordination:

| File                 | Primary Owner  | Secondary Owners | Coordination Notes                                                              |
| -------------------- | -------------- | ---------------- | ------------------------------------------------------------------------------- |
| `package.json`       | devops-compose | all agents       | All agents may add dependencies; devops-compose maintains structure and scripts |
| `tsconfig.json`      | devops-compose | backend-db       | Backend may add path aliases for type imports                                   |
| `next.config.js`     | devops-compose | frontend-ui      | Frontend may add image domains, redirects, or rewrites                          |
| `tailwind.config.js` | frontend-ui    | devops-compose   | Frontend owns theme customization; devops maintains plugin setup                |

## Modification Rules

### Owned Paths

- Agent has full authority to create, modify, and delete files
- No coordination required for changes within owned paths
- Agent is responsible for maintaining code quality and consistency

### Primary Ownership (Shared Resources)

- Primary owner maintains the overall structure of the file
- Must approve structural changes from secondary owners
- Responsible for resolving conflicts in the file

### Secondary Ownership (Shared Resources)

- May add entries (dependencies, configuration options) to the file
- Must not change overall structure without primary owner approval
- Should document changes in commit messages for primary owner awareness

## Conflict Resolution Protocol

1. **Within Owned Paths**: Agent resolves independently
2. **Shared Resources**:
   - Primary owner has final say on structure
   - Secondary owners coordinate via `coordination/QUESTIONS.md`
3. **Cross-Agent Dependencies**:
   - Use `coordination/HANDOFF-PROTOCOL.md` for interface agreements
   - Document API contracts before implementation

## Branch Strategy

```
main
└── feature/afc-0-console-proof-of-life (sprint branch)
    ├── agent/backend-db
    ├── agent/frontend-ui
    ├── agent/github-integration
    ├── agent/devops-compose
    └── agent/qa-proof-docs
```

### Merge Order (Recommended)

1. `agent/devops-compose` - Infrastructure and configuration first
2. `agent/backend-db` - Database schema and APIs
3. `agent/github-integration` - Authentication and webhooks
4. `agent/frontend-ui` - UI components and pages
5. `agent/qa-proof-docs` - Tests and documentation

This order minimizes conflicts by establishing foundational layers before dependent code.

## Questions and Coordination

- Cross-agent questions: `coordination/QUESTIONS.md`
- Interface agreements: `coordination/HANDOFF-PROTOCOL.md`
- Sprint planning: `coordination/SPRINT-AFC-0.md`
