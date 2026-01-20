# AFC-RUNNER-UX-3: Project Repo Binding (Zero Typing)

**Gate:** AFC-RUNNER-UX-3  
**Status:** ✅ COMPLETE  
**Date:** 2026-01-18

## Goal

Enable blueprint batch execution to pull repository configuration from Project settings, eliminating the need for manual typing during execution.

## Definition of Done (DoD)

### 1. DB + API ✅

- **Schema Changes:**
  - Added `repoOwner` (string, nullable) to Project model
  - Added `baseBranch` (string, nullable, default "main") to Project model
  - Migration: `20260118201805_add_project_repo_binding`

- **API Endpoints:**
  - `GET /api/projects/[id]` - Returns project including new repo fields
  - `PATCH /api/projects/[id]` - Updates repo fields with validation
    - Validates non-empty `repoOwner` and `repoName`
    - `baseBranch` optional, defaults to "main"

**Files:**

- `prisma/schema.prisma` - Project model updated
- `prisma/migrations/20260118201805_add_project_repo_binding/migration.sql` - Migration SQL
- `src/app/api/projects/[id]/route.ts` - PATCH endpoint added

### 2. UI: Project Settings ✅

- **Settings Page:** `/projects/[id]/settings`
- **Form Inputs:**
  - `project-repo-owner` (required)
  - `project-repo-name` (required)
  - `project-repo-branch` (optional, defaults to "main")
  - `project-repo-save` (save button)

**Files:**

- `src/app/projects/[id]/settings/page.tsx` - Settings UI component

### 3. Blueprint Detail Execute Behavior ✅

- **Logic:**
  - Blueprint API now fetches project repo config if `projectId` exists
  - If config exists: Execute immediately without modal
  - If config missing: Show blocking warning banner with link to settings
- **Test IDs:**
  - `blueprint-execute-pending` - Execute button (existing)
  - `blueprint-missing-repo-config` - Warning banner when config missing
  - `blueprint-go-to-project-settings` - Link to project settings

**Files:**

- `src/app/api/blueprints/[id]/route.ts` - Fetch project repo config
- `src/app/blueprints/[id]/page.tsx` - Execute logic updated

### 4. E2E Test ✅

**Test File:** `tests/runner-ux-project-repo-binding.spec.ts`

**Test Cases:**

1. ✅ Execute blueprint batch without modal when project repo config exists
   - Seeds project with repo config
   - Seeds blueprint attached to project
   - Seeds 2 PENDING work orders
   - Clicks execute button
   - Asserts navigation to `/executions/{id}` WITHOUT modal
   - Asserts COMPLETED status (DRY RUN)
   - Asserts PR link visible
   - Asserts run summary shows correct counts

2. ✅ Show warning and link to settings when project repo config is missing
   - Seeds project WITHOUT repo config
   - Seeds blueprint attached to project
   - Asserts warning banner visible
   - Asserts link to settings visible
   - Asserts modal appears when execute clicked

3. ✅ Project settings page allows configuring repo binding
   - Seeds project
   - Navigates to settings page
   - Fills in form fields
   - Clicks save
   - Asserts success message

**Supporting Files:**

- `src/app/api/test/seed/project/route.ts` - Test seed endpoint for projects

### 5. Evidence ✅

**Files:**

- `evidence/AFC-RUNNER-UX-3/README.md` - This file
- `evidence/AFC-RUNNER-UX-3/e2e-proof-snippet.ts` - E2E test proof snippet

## Implementation Summary

### Database Schema

```sql
ALTER TABLE "Project"
  ADD COLUMN "repoOwner" TEXT,
  ADD COLUMN "baseBranch" TEXT DEFAULT 'main';
```

### API Changes

- **PATCH /api/projects/[id]** - New endpoint for updating repo config
- **GET /api/blueprints/[id]** - Enhanced to include `projectRepoConfig`

### UI Components

- **Project Settings Page** - New page at `/projects/[id]/settings`
- **Blueprint Detail Page** - Updated to use project config for batch execute
- **Warning Banner** - Shows when config is missing with link to settings

### E2E Tests

- **3 test cases** covering happy path, missing config, and settings page
- Uses DRY RUN mode for deterministic execution
- Includes test seed endpoint for projects

## PR Checklist

- ✅ Schema migration created
- ✅ API endpoints implemented with validation
- ✅ Project settings UI created with required testids
- ✅ Blueprint execute logic updated
- ✅ Warning banner added for missing config
- ✅ E2E tests created and passing
- ✅ Evidence documentation complete
- ✅ No scope creep - only implemented UX-3 requirements

## Notes

- Modal from UX-2 is preserved for backwards compatibility when config is missing
- Guard on test seed endpoint ensures it only works in test/CI/dev environments
- All required testids are present for E2E verification
- Project repo config is optional - if not set, falls back to modal behavior
