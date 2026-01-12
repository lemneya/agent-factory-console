# AFC-1.6: Memory Layer MVP - Evidence

## Summary

AFC-1.6 implements the Memory Layer MVP for the Agent Factory Console, providing:

- **Prisma Models**: MemoryItem, MemoryUse, MemoryPolicy, RunMemorySnapshot
- **MemoryProvider Interface**: Abstract interface for memory storage and retrieval
- **PrismaMemoryProvider**: Full implementation with dedupe, scoring, scope filtering, budget enforcement
- **API Endpoints**:
  - `POST /api/memory/ingest` - Ingest memory items with deduplication
  - `POST /api/memory/query` - Query memory with filtering and budget enforcement
  - `GET/PUT /api/memory/policy` - Manage project memory policies
  - `GET/POST /api/runs/[id]/memory/uses` - Track memory usage per run
  - `GET/POST /api/runs/[id]/memory/snapshots` - Manage memory snapshots
- **UI Components**:
  - MemoryPanel - Memory tab on Run Detail page
  - PolicyEditor - Memory policy configuration
  - Project Memory page at `/projects/[id]/memory`

## Evidence Files

- `prisma-generate.log` - Prisma client generation output
- `build.log` - Next.js build output showing all routes
- `lint.log` - ESLint check output
- `test.log` - Jest test results

## Key Features

### Deduplication
- Content hashing using SHA-256
- Automatic deduplication on ingest
- Access count and score boost for duplicates

### Scoring System
- Score-based ranking (0-1 scale)
- Daily decay factor for aging content
- Access boost for frequently used items

### Scope Filtering
- GLOBAL: Available across all projects
- PROJECT: Available within a single project
- RUN: Available only within a single run

### Budget Enforcement
- Max items per project
- Max tokens per query
- Max total tokens stored
- Automatic archiving of low-score items when at limit

### Categories
- CODE - Code snippets, implementations
- DOCUMENTATION - Docs, READMEs, comments
- DECISION - Architectural decisions, ADRs
- ERROR - Error patterns, solutions
- CONTEXT - General context, background info
- CUSTOM - User-defined category

## Test Results

```
Test Suites: 1 skipped, 13 passed, 13 of 14 total
Tests:       6 skipped, 204 passed, 210 total
```

## Build Output

The build successfully includes all memory API routes:
- /api/memory/ingest
- /api/memory/policy
- /api/memory/query
- /api/runs/[id]/memory/snapshots
- /api/runs/[id]/memory/uses
- /projects/[id]/memory

## Date

2026-01-12
