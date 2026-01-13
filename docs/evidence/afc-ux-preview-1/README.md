# AFC-UX-PREVIEW-1: Preview Presets + Persistence + Improved Route Health

## Summary

This feature adds preset-based URL switching, persistence, and improved route health detection to the Preview panel.

## Features Implemented

### 1. Preset-Based URL Switcher
- Dropdown selector for switching between preview environments
- Default presets: Local, Staging, Production
- Environment variable support via `NEXT_PUBLIC_PREVIEW_URL`
- Presets stored in localStorage for persistence

### 2. PresetEditorModal Component
- Full CRUD operations for managing presets
- Add new presets with name and URL
- Edit existing preset names and URLs
- Delete custom presets (ENV presets are protected)
- Validation for name (required) and URL (must start with http:// or https://)

### 3. Route Persistence
- Current path persisted to localStorage
- Active preset selection persisted to localStorage
- State restored on page load

### 4. Deep Link Support
- URL query parameters: `?path=/runs&preset=local`
- Shareable links for specific routes and presets
- Parameters applied on page load

### 5. Open Current Route Button
- Opens the current preview URL in a new browser tab
- Disabled when no URL is configured

### 6. Improved Route Health API
- Detects HTTP redirects (301, 302, 307, 308)
- Identifies auth redirects (redirects to /login, /signin, /auth)
- Returns redirect URL in response
- Measures latency for all requests

### 7. Updated RouteHealthGrid UI
- New status icons:
  - ✅ 200 OK
  - 🔒 Auth redirect
  - ↪️ Other redirect
  - ⚠️ 404 Not Found
  - ❌ Error
- Color-coded status indicators
- Status legend at bottom of grid

## Files Changed

### New Files
- `src/components/preview/PresetEditorModal.tsx` - Modal for editing presets
- `src/components/preview/usePreviewPresets.ts` - Hook for preset management
- `tests/preview-presets.spec.ts` - E2E tests for preset functionality

### Modified Files
- `src/app/preview/page.tsx` - Added preset selector, deep linking, open current button
- `src/app/api/preview/route-health/route.ts` - Added redirect detection
- `src/components/preview/RouteHealthGrid.tsx` - Added baseUrl prop, redirect icons
- `src/components/preview/index.ts` - Export new components

## E2E Tests

11 new tests covering:
- Page renders with preset dropdown
- Default presets shown in dropdown
- Edit presets button opens modal
- Preset editor modal has add button
- Can add a new preset
- Route health grid is visible
- Route health grid has refresh button
- Open current route button is visible
- Deep link with path param
- Deep link with preset param
- Preset persistence to localStorage

## API Changes

### POST /api/preview/route-health

Request body now accepts optional `baseUrl`:
```json
{
  "path": "/runs",
  "baseUrl": "https://staging.example.com"
}
```

Response now includes redirect information:
```json
{
  "path": "/runs",
  "status": 302,
  "ok": false,
  "latencyMs": 45,
  "redirected": true,
  "redirectUrl": "https://example.com/login"
}
```

## CI Status

- ✅ CI (lint, type-check, build)
- ✅ Docker Build
- ✅ E2E Tests

## PR

https://github.com/lemneya/agent-factory-console/pull/23
