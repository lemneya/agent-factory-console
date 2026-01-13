# AFC-UX-PREVIEW-1: Preview Presets + Persistence

## Summary

Implemented URL presets, preset editor modal, route persistence, and improved route health signals for the preview panel.

## Components Created/Updated

### New Components

1. **`usePreviewPresets.ts`** - Hook for localStorage-backed preset management
   - Default presets: Local Dev, Staging, Production
   - CRUD operations: add, update, delete presets
   - Persistence in `afc_preview_presets` localStorage key

2. **`PresetEditorModal.tsx`** - Modal for managing presets
   - Add new presets with name + URL
   - Edit existing presets
   - Delete presets (with confirmation)
   - data-testid attributes for E2E testing

### Updated Components

1. **`/preview/page.tsx`** - Main preview page
   - Preset dropdown with "Manage Presets" button
   - Route persistence in `afc_preview_route` localStorage
   - Deep link support: `?preset=<id>&route=<path>`
   - "Open Current Route" button
   - Current route display

2. **`RouteHealthGrid.tsx`** - Route health display
   - Accepts optional `baseUrl` prop for preset support
   - Improved redirect detection (↪️ icon)
   - Auth redirect detection (🔒 icon for /login, /signin, /auth)
   - Status legend at bottom

3. **`/api/preview/route-health/route.ts`** - Health check API
   - Accepts optional `baseUrl` parameter
   - Uses `redirect: 'manual'` to detect redirects
   - Returns `redirected` and `redirectUrl` fields
   - Detects auth redirects vs. other redirects

## Deep Link Support

The preview page supports deep linking via URL parameters:

- `?preset=<preset-id>` - Select a specific preset
- `?route=<path>` - Navigate to a specific route in the iframe
- Combined: `?preset=staging&route=/runs`

## Route Persistence

- Current route is saved to `afc_preview_route` localStorage
- Route is restored on page load
- Route is updated when clicking routes in the health grid

## Status Icons

| Icon | Meaning                                     |
| ---- | ------------------------------------------- |
| ✅   | 200 OK                                      |
| 🔒   | Auth required (401/403 or redirect to auth) |
| ↪️   | Redirect (non-auth)                         |
| ⚠️   | 404 Not Found                               |
| ❌   | Error (500+, timeout, network)              |
| ⏳   | Loading                                     |

## Acceptance Criteria

- [x] Preset dropdown with add/edit/delete
- [x] Deep link support (?preset=&route=)
- [x] Route persistence in localStorage
- [x] "Open Current Route" button
- [x] Improved redirect detection in health API
- [x] Status legend in RouteHealthGrid
- [x] E2E tests for preset CRUD and deep links

## Files Changed

- `src/app/preview/page.tsx` (updated)
- `src/app/api/preview/route-health/route.ts` (updated)
- `src/components/preview/RouteHealthGrid.tsx` (updated)
- `src/components/preview/PresetEditorModal.tsx` (new)
- `src/components/preview/usePreviewPresets.ts` (new)
- `src/components/preview/index.ts` (updated)
- `tests/preview-presets.spec.ts` (new)
