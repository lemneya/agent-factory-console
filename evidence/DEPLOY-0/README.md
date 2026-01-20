# DEPLOY-0: Production Deployment Wiring

## Summary

This document provides the complete deployment guide for the Agent Factory Console application. It includes environment configuration, deployment scripts, health checks, and operational runbook.

## Audit Date

2026-01-19

## Deliverables

### 1. Environment Templates

| File                      | Purpose                          |
| ------------------------- | -------------------------------- |
| `.env.example`            | Development environment template |
| `.env.production.example` | Production environment template  |

### 2. Docker Configuration

| File                            | Purpose                      |
| ------------------------------- | ---------------------------- |
| `docker-compose.yml`            | Development environment      |
| `docker-compose.production.yml` | Production environment       |
| `Dockerfile`                    | Multi-stage build (dev/prod) |

### 3. Deployment Scripts

| File                 | Purpose                     |
| -------------------- | --------------------------- |
| `scripts/deploy.sh`  | Automated deployment script |
| `scripts/migrate.sh` | Database migration script   |

### 4. Health Checks

| Endpoint          | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `GET /api/health` | Comprehensive health check with DB connectivity |

---

## Deployment Runbook

### Prerequisites

1. **Docker & Docker Compose** installed
2. **PostgreSQL** database (external managed or local)
3. **GitHub OAuth App** configured for production domain
4. **Domain/SSL** configured (for HTTPS)

### Step 1: Environment Configuration

```bash
# Copy production template
cp .env.production.example .env.production

# Edit with actual values
# REQUIRED variables:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET
# - GITHUB_WEBHOOK_SECRET
```

**Generate secrets:**

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate GITHUB_WEBHOOK_SECRET
openssl rand -hex 20

# Generate GATEWAY_AUTH_TOKEN (if terminal enabled)
openssl rand -hex 32
```

### Step 2: Build & Deploy

```bash
# Option A: Using deploy script (recommended)
./scripts/deploy.sh production

# Option B: Manual deployment
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml --profile migrate run --rm migrate
docker compose -f docker-compose.production.yml up -d web
```

### Step 3: Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-19T...",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": { "status": "healthy", "latencyMs": 5 },
    "memory": { "status": "healthy", "heapUsedMB": 150, "heapTotalMB": 512 }
  }
}
```

### Step 4: Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Add webhook:
   - **Payload URL**: `https://your-domain.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Use the value from `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select relevant events (push, pull_request, etc.)

---

## Database Migrations

### Running Migrations

```bash
# Production migration
./scripts/migrate.sh

# Dry run (show pending migrations)
./scripts/migrate.sh --dry-run

# Via Docker
docker compose -f docker-compose.production.yml --profile migrate run --rm migrate
```

### Rollback (if needed)

```bash
# View migration history
npx prisma migrate status

# Rollback is manual - create a new migration that reverses changes
```

---

## Monitoring & Operations

### Health Check Endpoint

**URL**: `GET /api/health`

**Response Codes**:

- `200`: All systems healthy
- `503`: One or more systems unhealthy

**Checks Performed**:

- Database connectivity and latency
- Memory usage

### Logs

```bash
# View application logs
docker compose -f docker-compose.production.yml logs -f web

# View last 100 lines
docker compose -f docker-compose.production.yml logs --tail 100 web
```

### Restart Services

```bash
# Restart web service
docker compose -f docker-compose.production.yml restart web

# Full restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

### Scale (if needed)

```bash
# Scale web service (behind load balancer)
docker compose -f docker-compose.production.yml up -d --scale web=3
```

---

## Security Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_DEV_AUTH_BYPASS` is `false` or unset
- [ ] `NEXTAUTH_SECRET` is a strong random value
- [ ] `GITHUB_WEBHOOK_SECRET` is set
- [ ] Database uses SSL (`?sslmode=require`)
- [ ] HTTPS is configured for NEXTAUTH_URL
- [ ] GitHub OAuth callback URL is correct
- [ ] Terminal gateway is disabled (`TERMINAL_ENABLED=false`)

---

## Troubleshooting

### Database Connection Failed

```bash
# Test database connection
docker compose -f docker-compose.production.yml exec web npx prisma db pull

# Check DATABASE_URL format
# postgresql://user:password@host:5432/database?sslmode=require
```

### Health Check Returns 503

1. Check database connectivity
2. Check application logs
3. Verify environment variables are set

### Migration Failed

```bash
# Check migration status
npx prisma migrate status

# View migration files
ls -la prisma/migrations/
```

---

## Files Added/Modified

```
.env.production.example                    (NEW)
docker-compose.production.yml              (NEW)
scripts/deploy.sh                          (NEW)
scripts/migrate.sh                         (NEW)
src/app/api/health/route.ts                (Modified)
evidence/DEPLOY-0/README.md                (NEW)
```

---

## Sign-off

- Executor: Claude Code (Track B)
- Date: 2026-01-19
- Status: ✅ Complete
