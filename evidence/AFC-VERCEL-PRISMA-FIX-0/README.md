# AFC-VERCEL-PRISMA-FIX-0: Deterministic Prisma Generate on Vercel

## Purpose

Ensures Prisma Client is always generated during Vercel builds, preventing cache-related failures where `@prisma/client` exists but generated code is missing.

## What Changed

### package.json scripts

```diff
- "build": "next build"
+ "build": "prisma generate && next build"
+ "postinstall": "prisma generate"
```

## Why This Fixes Vercel Caching

Vercel caches `node_modules` between deployments. The problem:

1. `@prisma/client` package exists in cache
2. But generated Prisma Client code (from `prisma generate`) is missing
3. Runtime imports fail with "Prisma Client not generated" errors

The fix ensures:

- `postinstall`: Runs `prisma generate` after every `npm ci` (handles fresh installs)
- `build`: Runs `prisma generate` before `next build` (handles cached scenarios)

This is idempotent - running `prisma generate` multiple times is safe.

## Verification Outputs

```
npm run lint       → CLEAN
npm run format:check → PASS
npx tsc --noEmit   → PASS
npm run build      → PASS (Prisma Client generated in 122ms)
```

## Build Output Excerpt

```
> prisma generate && next build

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 122ms

▲ Next.js 16.1.1 (Turbopack)
✓ Compiled successfully
```

## Notes

- `prisma` CLI remains in `devDependencies` (Vercel installs devDeps by default)
- If Vercel fails because `prisma` CLI is missing, move it to `dependencies`
