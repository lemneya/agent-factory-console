# AFC-EMPTY-STATE-API-0: Empty State API Responses

## Summary

This gate ensures `/api/projects` and `/api/adapters/status` return `200 + []` on a fresh DB with zero rows, and the UI shows clean empty states (not error banners).

## Implementation Status

### API Routes - Already Correct

Both routes use `prisma.*.findMany()` which returns an empty array when no rows exist:

**`/api/projects` (src/app/api/projects/route.ts)**
```typescript
const projects = await prisma.project.findMany({...});
return NextResponse.json(projects);  // Returns [] when empty
```

**`/api/adapters/status` (src/app/api/adapters/status/route.ts)**
```typescript
const adapters = await prisma.adapter.findMany({...});
return NextResponse.json(adapters.map(...));  // Returns [] when empty
```

### UI Components - Already Correct

**`/projects` page (src/app/projects/page.tsx:231-303)**
```tsx
{projects.length === 0 ? (
  <div className="rounded-xl border border-dashed...">
    <h3>No projects yet</h3>
    <p>Get started by creating a new project...</p>
    {/* Create Project and Sync buttons */}
  </div>
) : (...)}
```

**`/adapters` page (src/app/adapters/page.tsx:194-205)**
```tsx
{!loading && !error && adapters.length === 0 && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
    <h3>No adapters registered</h3>
    <p>Get started by seeding the adapter registry...</p>
    <code>POST /api/adapters/seed</code>
  </div>
)}
```

## Key Insight

The APIs only fail with 500 if the **database tables don't exist** (migration not run). Once migrations are applied (DEPLOY-DB-MIGRATE-0), empty tables correctly return 200 + [].

**Important**: Do NOT "paper over" missing tables with try/catch returning []. Missing tables = deploy failure that must be fixed by migrations.

## Verification Steps

After running migrations on a fresh DB:

```bash
# Verify /api/projects returns 200 + empty array
curl -s http://localhost:3000/api/projects | jq
# Expected: []

# Verify /api/adapters/status returns 200 + empty array
curl -s http://localhost:3000/api/adapters/status | jq
# Expected: []

# Verify UI shows empty state (not error)
# Navigate to http://localhost:3000/projects
# Expected: "No projects yet" message with Create/Sync buttons

# Navigate to http://localhost:3000/adapters
# Expected: "No adapters registered" message
```

## DoD Checklist

- [x] `/api/projects` returns `200 + []` on empty table
- [x] `/api/adapters/status` returns `200 + []` on empty table
- [x] `/projects` page renders clean empty state
- [x] `/adapters` page renders clean empty state
- [x] No "Failed to fetch" error banners on empty DB
- [x] No try/catch masking missing tables (500 on missing tables is correct)

## Evidence

See curl logs and screenshots in this directory after running verification.
