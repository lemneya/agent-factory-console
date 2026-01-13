# AFC-UX-PREVIEW-0: Preview Panel MVP

## Implementation Summary

This gate implements the Preview Panel MVP with iframe preview, route health grid, and smoke proof card.

## Components Implemented

### 1. Navigation Configuration (`src/config/nav.tsx`)

- Created `NAV_ITEMS` array as single source of truth for all navigation
- Added Preview route with Eye icon
- Exported helper functions: `getNavItem()`, `getRouteHealthItems()`

### 2. Sidebar Update (`src/components/layout/Sidebar.tsx`)

- Updated to use `NAV_ITEMS` from config
- Added `data-testid="nav-{key}"` for each nav item
- Removed hardcoded navigation array

### 3. Route Health API (`src/app/api/preview/route-health/route.ts`)

- POST endpoint that checks route health
- Fetches from `NEXT_PUBLIC_PREVIEW_URL` + path
- Returns: `{ path, status, ok, latencyMs, error? }`
- 5 second timeout
- Does NOT forward cookies/auth (health check only)

### 4. Smoke Status API (`src/app/api/preview/smoke-status/route.ts`)

- GET endpoint that reads from `evidence/preview/SMOKE_STATUS.json`
- Returns test status for: nav-smoke, auth-cta, happy-path
- Returns UNKNOWN status if file doesn't exist

### 5. RouteHealthGrid Component (`src/components/preview/RouteHealthGrid.tsx`)

- Displays health status for all routes from NAV_ITEMS
- Auto-refreshes every 30 seconds
- Status icons: ✅ (200), 🔒 (401/403), ⚠️ (404), ❌ (error)
- "Open" button to load route in iframe
- `data-testid="route-health-grid"` and `data-testid="route-row-{key}"`

### 6. SmokeStatusCard Component (`src/components/preview/SmokeStatusCard.tsx`)

- Displays smoke test status from API
- Shows overall status badge (PASS/FAIL/UNKNOWN)
- Lists individual test results with pass counts
- Auto-refreshes every 60 seconds
- `data-testid="smoke-status-card"`

### 7. Preview Page (`src/app/preview/page.tsx`)

- Split view: iframe (left) + health panels (right)
- URL bar with traffic light dots
- "Open in New Tab" and "Refresh Preview" buttons
- Shows configuration message if `NEXT_PUBLIC_PREVIEW_URL` not set
- `data-testid="page-root"`, `data-testid="page-title"`, `data-testid="preview-iframe"`

### 8. Environment Configuration

- Added to `.env.example`:
  - `NEXT_PUBLIC_PREVIEW_URL` - URL of running app to preview
  - `NEXT_PUBLIC_DEV_AUTH_BYPASS` - Enable demo mode bypass

## Files Created/Modified

### New Files

- `src/config/nav.tsx`
- `src/app/preview/page.tsx`
- `src/app/api/preview/route-health/route.ts`
- `src/app/api/preview/smoke-status/route.ts`
- `src/components/preview/RouteHealthGrid.tsx`
- `src/components/preview/SmokeStatusCard.tsx`
- `src/components/preview/index.ts`
- `tests/preview.spec.ts`
- `evidence/preview/SMOKE_STATUS.json`
- `evidence/AFC-UX-PREVIEW-0/NOTES.md`

### Modified Files

- `src/components/layout/Sidebar.tsx` - Use NAV_ITEMS
- `.env.example` - Add preview keys

## Test Coverage

### E2E Tests (`tests/preview.spec.ts`)

1. Preview page renders with all components
2. Preview page accessible from sidebar
3. Route health grid shows all routes
4. Smoke status card shows test status
5. smoke-status API returns valid response
6. route-health API validates path parameter

## Acceptance Criteria

- [x] `/preview` page renders
- [x] iframe shows the preview URL (or config message)
- [x] RouteHealthGrid pings all routes in NAV_ITEMS
- [x] SmokeStatusCard reads from evidence/preview/SMOKE_STATUS.json
- [x] E2E tests pass
- [x] Evidence committed
