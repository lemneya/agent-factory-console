# E2E Stabilization Fix Notes

## Issues Fixed

### 1. nav-smoke.spec.ts - Count Mismatch

**Problem:** Test was hardcoded to expect exactly 10 nav items, but NAV_ITEMS now has 13 (added preview, copilot, drafts).

**Fix:** Updated NAV_ROUTES array in test to match the full NAV_ITEMS from `src/config/nav.tsx`. Changed test title from "sidebar contains all 10 navigation items" to "sidebar contains all expected navigation items".

### 2. auth-cta.spec.ts - CTA Panel Timeouts

**Problem:** /blueprints and /workorders pages were static pages without auth handling, causing timeouts when tests expected SignedOutCTA.

**Fix:** Converted both pages to client components with proper auth handling:

- Added `useSession` hook for auth status
- Added `useDemoMode` hook for demo mode support
- Return `SignedOutCTA` immediately when unauthenticated and not in demo mode
- Added loading state to prevent flash

### 3. assets.spec.ts - searchInput Not Visible

**Problem:** Assets page was a static placeholder without search/filter UI that tests expected.

**Fix:** Converted to client component with:

- Proper auth handling (SignedOutCTA for unauthenticated users)
- Added search input with `data-testid="assets-search"`
- Added category filter dropdown
- Added "New Asset" link
- Added demo mode support

### 4. council.spec.ts - maintenanceRisk Filter

**Problem:** API was trying to filter by `maintenanceRisk` field which doesn't exist in the CouncilDecision schema.

**Fix:** Removed the filter application but kept parameter acceptance. API now gracefully ignores the parameter without throwing an error, returning 200 OK.

## Files Changed

- `tests/nav-smoke.spec.ts` - Updated NAV_ROUTES array
- `src/app/blueprints/page.tsx` - Added auth handling
- `src/app/workorders/page.tsx` - Added auth handling
- `src/app/assets/page.tsx` - Added auth handling + search/filter UI
- `src/app/api/council/decisions/route.ts` - Removed maintenanceRisk filter
