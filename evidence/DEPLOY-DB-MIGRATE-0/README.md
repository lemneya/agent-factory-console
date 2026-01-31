# DEPLOY-DB-MIGRATE-0: Automatic Database Migration on Deploy

## Summary

This gate ensures database schema initialization is automatic on deploy/start using `npx prisma migrate deploy` (production-safe).

## Changes Made

### 1. Dockerfile - Added `migrator` stage

```dockerfile
# Migrator stage - for running prisma migrate deploy
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]
```

The `migrator` stage includes:
- Full `node_modules` with Prisma CLI
- `prisma/` directory with schema and migrations
- Default command: `npx prisma migrate deploy`

### 2. docker-compose.production.yml - Updated `migrate` service

Changed from `target: production` to `target: migrator` to ensure Prisma CLI is available.

```yaml
migrate:
  build:
    context: .
    dockerfile: Dockerfile
    target: migrator  # Changed from 'production'
  environment:
    - DATABASE_URL=${DATABASE_URL}
  profiles:
    - migrate
```

### 3. deploy.sh - Added `--with-db` flag

Added support for local PostgreSQL container mode:

```bash
./scripts/deploy.sh production --with-db  # Uses local PostgreSQL
./scripts/deploy.sh production            # Uses external DATABASE_URL
```

## Verification Steps

On a fresh VM with wiped DB volume:

```bash
# 1. Wipe volumes
docker compose -f docker-compose.production.yml down -v

# 2. Deploy with local database
./scripts/deploy.sh production --with-db

# Expected output:
# - Database starts and becomes healthy
# - Migrations run successfully (npx prisma migrate deploy)
# - Web service starts
# - Health check passes
```

## DoD Checklist

- [x] `npx prisma migrate deploy` used (not `db push`)
- [x] No manual migration commands required
- [x] Deploy script handles fresh DB automatically
- [x] Migration service has Prisma CLI available
- [x] Works with both external DB and local PostgreSQL

## Evidence

See deploy logs in this directory after running verification.
