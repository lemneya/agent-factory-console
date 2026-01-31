# AFC Deployment (SSOT)

This document is the single source of truth for deploying Agent Factory Console (AFC).

## Supported targets

- Vercel (Next.js app + API routes)

## Vercel: required environment variables

### Always required

- NEXTAUTH_SECRET = <random 32+ char secret>
- NEXTAUTH_URL = https://<your-vercel-domain>
- NODE_ENV = production

### Recommended to prevent install issues

- PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 1

### Database (only if features require DB at runtime)

- DATABASE_URL = <postgres connection string>

> Note: This repo includes Prisma for future/present features.
> Do NOT run migrations on Vercel builds. Migrations happen separately.

## Vercel build settings

This repo ships `vercel.json` to lock behavior:

- Install: npm ci
- Build: npm run build

## Smoke test

After deploy, run:

- GET /api/llm/registry?tenantId=<yourUserId>
- POST /api/llm/select (must return proofPack + runId)

See scripts/smoke-vercel.sh
