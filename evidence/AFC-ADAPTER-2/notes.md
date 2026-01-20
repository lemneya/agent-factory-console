# AFC-ADAPTER-2: Adapter Registry

## Overview

Vendor-neutral adapter registry allowing AFC to list and manage external runtime adapters (e.g., LangGraph host) without tight coupling.

## Data Model

### Adapter Schema

```prisma
model Adapter {
  id           String   @id @default(cuid())
  name         String   @unique
  version      String
  baseUrl      String
  capabilities Json     @default("[]") // string[] of capability identifiers
  enabled      Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([enabled])
  @@index([name])
}
```

### Fields

| Field        | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| id           | String   | Unique identifier (CUID)                     |
| name         | String   | Unique adapter name (e.g., "langgraph-host") |
| version      | String   | Adapter version (semver)                     |
| baseUrl      | String   | Internal/external URL for adapter runtime    |
| capabilities | Json     | Array of capability strings                  |
| enabled      | Boolean  | Whether adapter is active                    |
| createdAt    | DateTime | Record creation timestamp                    |
| updatedAt    | DateTime | Record update timestamp                      |

## API Endpoints

### GET /api/adapters

List all registered adapters.

**Query Parameters:**

- `enabled=true` - Filter to only enabled adapters

**Response:** Array of Adapter objects

### GET /api/adapters/:id

Get a single adapter by ID.

**Response:** Single Adapter object or 404

### POST /api/adapters/seed

Seed default adapter records (LangGraph host).

**Response:** Seeded adapter records

## How to Add Adapters

### Option 1: Seed API (Development)

```bash
curl -X POST http://localhost:3000/api/adapters/seed
```

### Option 2: Direct Database (Production)

```sql
INSERT INTO "Adapter" (
  "id", "name", "version", "baseUrl", "capabilities", "enabled", "createdAt", "updatedAt"
) VALUES (
  'clx...', 'my-adapter', '1.0.0', 'http://adapter-host:8080',
  '["capability-1", "capability-2"]', true, NOW(), NOW()
);
```

### Option 3: Prisma Studio

```bash
npx prisma studio
```

Navigate to the Adapter table and add records through the UI.

## Default Adapters

### LangGraph Host

```json
{
  "name": "langgraph-host",
  "version": "1.0.0",
  "baseUrl": "http://localhost:8123",
  "capabilities": ["graph-execution", "checkpoint-resume", "streaming"],
  "enabled": true
}
```

The baseUrl defaults to `http://localhost:8123` but can be configured via the `LANGGRAPH_HOST_URL` environment variable.

## Files Changed

1. **`prisma/schema.prisma`** - Added Adapter model
2. **`prisma/migrations/20260120000000_afc_adapter_2_adapter_registry/migration.sql`** - Migration
3. **`src/app/api/adapters/route.ts`** - List endpoint
4. **`src/app/api/adapters/[id]/route.ts`** - Detail endpoint
5. **`src/app/api/adapters/seed/route.ts`** - Seed endpoint

## Non-Scope (Future Work)

- No adapter execution/invocation
- No calling the adapter from AFC
- No auth changes
- No UI (optional future gate)
