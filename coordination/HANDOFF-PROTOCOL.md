# Agent Handoff Protocol

## Overview
This document defines how agents communicate status, request reviews, and hand off work to the Orchestrator.

---

## Branch Workflow

```
main
  └── feature/afc-0-console-proof-of-life (sprint branch)
        ├── agent/backend-db
        ├── agent/frontend-ui
        ├── agent/github-integration
        ├── agent/devops-compose
        └── agent/qa-proof-docs
```

---

## Status Updates

Agents should update their status in commit messages and PR descriptions:

### Commit Message Format
```
[agent-id] action: brief description

- Detail 1
- Detail 2

Status: IN_PROGRESS | BLOCKED | READY_FOR_REVIEW | DONE
```

### Example
```
[backend-db] feat: add Prisma schema for all models

- Added Projects, Runs, Tasks, GitHubEvents models
- Created initial migration
- Set up Prisma client singleton

Status: READY_FOR_REVIEW
```

---

## Handoff Checklist

Before requesting merge to sprint branch:

### Code Quality
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Follows project conventions

### Testing
- [ ] Manual testing completed
- [ ] No regressions introduced

### Documentation
- [ ] Code is self-documenting or commented
- [ ] README updated if needed

### Boundaries
- [ ] Only modified owned paths
- [ ] Cross-boundary changes approved by Orchestrator

---

## Requesting Orchestrator Review

1. Push all changes to agent branch
2. Create PR to sprint branch with:
   - Summary of changes
   - Checklist completion status
   - Any blockers or dependencies
3. Tag Orchestrator for review

---

## Merge Order (Recommended)

For AFC-0, suggested merge order to minimize conflicts:

1. `agent/devops-compose` - Infrastructure first
2. `agent/backend-db` - Database schema and APIs
3. `agent/github-integration` - Auth and webhooks
4. `agent/frontend-ui` - UI components and pages
5. `agent/qa-proof-docs` - Tests and docs last

---

## Conflict Resolution

If merge conflicts occur:

1. Orchestrator identifies conflicting files
2. Orchestrator determines which agent has ownership
3. Owning agent resolves conflict on their branch
4. Re-request merge

---

## Communication Channels

- **Blockers**: Document in PR, tag Orchestrator
- **Questions**: Add to coordination/QUESTIONS.md
- **Dependencies**: Document in PR description
