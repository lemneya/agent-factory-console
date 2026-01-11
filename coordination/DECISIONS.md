# Architecture Decisions

This document records significant architectural decisions made during AFC development.

---

## ADR-001: Single Root App = Next.js (App Router)

**Date:** 2026-01-10
**Status:** Accepted
**Deciders:** Orchestrator, Team

### Context

During AFC-0 development, two parallel UI approaches emerged:

1. **PR #2**: Vite-based React SPA (frontend-ui agent)
2. **PR #5**: Next.js App Router setup (backend-db agent)

Both approaches were valid starting points, but maintaining two root applications would cause:

- Conflicting build configurations
- Duplicated dependencies
- Unclear ownership of shared code
- Integration complexity for API routes

### Decision

**Use Next.js (App Router) as the single root application framework.**

- All UI pages and components will live under `src/app/` using App Router conventions
- No separate Vite build or root `index.html`
- Frontend components will be React Server Components by default, with `'use client'` where needed
- API routes will use Next.js Route Handlers (`src/app/api/`)

### Consequences

**Positive:**

- Single build pipeline and deployment
- Unified routing between pages and API
- Server-side rendering and React Server Components available
- Simplified dependency management
- Clear project structure

**Negative:**

- Vite prototype work (PR #2) retired
- Team members familiar with Vite-only setups need to adapt
- Some client-side patterns require explicit `'use client'` directive

### Alternatives Considered

1. **Keep both Vite and Next.js** - Rejected due to maintenance overhead
2. **Use Vite only with separate API server** - Rejected; loses benefits of integrated Next.js API routes
3. **Use Create React App** - Rejected; CRA is deprecated

---

## Decision Template

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded
**Deciders:** [who made the decision]

### Context

[What is the issue that we're seeing that is motivating this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Consequences

**Positive:**

- [benefit 1]

**Negative:**

- [drawback 1]

### Alternatives Considered

1. [Alternative 1] - [why rejected]
```
