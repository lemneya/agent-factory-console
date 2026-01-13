## Summary

Implements AFC-UX-PREVIEW-0: Preview Panel MVP with iframe preview, route health grid, and smoke proof card.

## Changes

### Navigation Configuration

- Created `src/config/nav.tsx` with `NAV_ITEMS` array as single source of truth
- Added Preview route with Eye icon
- Exported helper functions: `getNavItem()`, `getRouteHealthItems()`

### Sidebar Update

- Updated to use `NAV_ITEMS` from config
- Added `data-testid="nav-{key}"` for each nav item

### Preview Page (`/preview`)

- Split view: iframe (left) + health panels (right)
- URL bar with traffic light dots
- "Open in New Tab" and "Refresh Preview" buttons
- Shows configuration message if `NEXT_PUBLIC_PREVIEW_URL` not set

### Route Health API

- POST `/api/preview/route-health` - checks route health
- Returns: `{ path, status, ok, latencyMs, error? }`
- 5 second timeout, does NOT forward cookies/auth

### Smoke Status API

- GET `/api/preview/smoke-status` - reads from `evidence/preview/SMOKE_STATUS.json`
- Returns test status for: nav-smoke, auth-cta, happy-path

### Components

- `RouteHealthGrid` - displays health status for all routes, auto-refresh every 30s
- `SmokeStatusCard` - displays smoke test status, auto-refresh every 60s

### Environment

- Added `NEXT_PUBLIC_PREVIEW_URL` to `.env.example`
- Added `NEXT_PUBLIC_DEV_AUTH_BYPASS` to `.env.example`

## Testing

- E2E tests in `tests/preview.spec.ts`
- Tests preview page rendering, sidebar navigation, route health grid, smoke status card, and API endpoints

## Evidence

- `evidence/AFC-UX-PREVIEW-0/NOTES.md` - implementation notes
- `evidence/preview/SMOKE_STATUS.json` - stub file for smoke status

## Acceptance Criteria

- [x] `/preview` page renders
- [x] iframe shows the preview URL (or config message)
- [x] RouteHealthGrid pings all routes in NAV_ITEMS
- [x] SmokeStatusCard reads from evidence/preview/SMOKE_STATUS.json
- [x] E2E tests pass
- [x] Evidence committed
