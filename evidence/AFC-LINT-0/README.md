# AFC-LINT-0: Fix Pre-existing Lint/Format Drift

## Summary

Fixed pre-existing Prettier formatting issues that were causing CI failures on main.

## What Was Failing

### Prettier (`npm run format:check`)

17 files had formatting issues:

- `evidence/AFC-ADAPTER-4/notes.md`
- `evidence/AFC-BLUEPRINT-UI-RULE-0/validation_proof.md`
- `evidence/AFC-C2-STREAM-0/README.md`
- `evidence/DEPLOY-FIX-1/README.md`
- `src/app/adapters/page.tsx`
- `src/app/api/c2/sessions/[id]/events/route.ts`
- `src/app/api/c2/sessions/[id]/route.ts`
- `src/app/api/c2/sessions/[id]/simulate/start/route.ts`
- `src/app/api/c2/sessions/[id]/simulate/stop/route.ts`
- `src/app/api/c2/stream/route.ts`
- `src/components/c2/C2AgentGrid.tsx`
- `src/components/c2/C2BrainPanel.tsx`
- `src/components/c2/C2Dashboard.tsx`
- `src/components/c2/C2OpsConsole.tsx`
- `src/components/c2/C2VaultPanel.tsx`
- `src/lib/blueprint-validation.ts`
- `src/lib/c2-simulation.ts`

### ESLint (`npm run lint`)

4 warnings (0 errors) - pre-existing, not blocking:

- `_maintenanceRisk` unused in `src/app/api/council/decisions/route.ts`
- `searchParams` unused in `src/app/copilot/page.tsx`
- Missing `session` dependency in useEffect in `src/components/c2/C2Dashboard.tsx`
- `C2EventType` unused in `src/lib/c2-simulation.ts`

## Commands Run

```bash
# Capture before state
npm run lint | tee evidence/AFC-LINT-0/lint-before.log
npm run format:check | tee -a evidence/AFC-LINT-0/lint-before.log

# Fix formatting
npm run format

# Verify fix
npm run format:check | tee evidence/AFC-LINT-0/lint-after.log
npm run lint | tee -a evidence/AFC-LINT-0/lint-after.log

# Prove no logic change
npx tsc --noEmit
npm run build
```

## Before/After Logs

- `evidence/AFC-LINT-0/lint-before.log` - Shows 17 files with formatting issues
- `evidence/AFC-LINT-0/lint-after.log` - Shows "All matched files use Prettier code style!"

## Files Changed

All changes are whitespace/formatting only:

- 4 evidence markdown files (line wrapping)
- 6 API route files (code formatting)
- 5 component files (code formatting)
- 2 lib files (code formatting)
- 1 page file (code formatting)

## Assurance

**Formatting/lint-only changes. No logic changed.**

- TypeScript compilation: PASSED
- Next.js build: PASSED
- All changes are whitespace reformatting by Prettier
- No semantic code changes
- No new dependencies added
