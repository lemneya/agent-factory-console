# AFC-VERCEL-DEPLOY-HYGIENE-0: Vercel Deploy Hygiene

## Purpose

Makes Vercel deployment predictable by removing "repo ambiguity" and preventing common install/build failures.

## Non-goals

- No feature work
- No database migrations
- No changes to runtime behavior besides deploy hygiene

## Files Added

| File                      | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `vercel.json`             | Locks Vercel behavior: `npm ci` for install, `npm run build` for build |
| `.vercelignore`           | Prevents uploading non-runtime artifacts (evidence/, tests, docs)      |
| `docs/DEPLOYMENT.md`      | Single source of truth for deployment configuration                    |
| `scripts/smoke-vercel.sh` | Post-deploy smoke test script                                          |

## Required Environment Variables (Vercel)

### Always Required

- [ ] `NEXTAUTH_SECRET` - Random 32+ character secret
- [ ] `NEXTAUTH_URL` - Full URL of your Vercel deployment
- [ ] `NODE_ENV` - Set to `production`

### Recommended

- [ ] `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` - Prevents unnecessary browser downloads

### Database (if needed)

- [ ] `DATABASE_URL` - Postgres connection string

## Running Smoke Test

After deployment:

```bash
./scripts/smoke-vercel.sh https://your-app.vercel.app <yourUserId>
```

The script tests:

1. `GET /api/llm/registry` - Registry endpoint responds
2. `POST /api/llm/select` - Selection returns proofPack + runId

## Verification Commands

```bash
npm run lint
npm run format:check
npx tsc --noEmit
npm run build
```
