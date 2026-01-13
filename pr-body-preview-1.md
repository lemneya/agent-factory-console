## Summary

AFC-UX-PREVIEW-1: Preview presets + persistence + improved route health

This PR adds URL presets, preset editor modal, route persistence, and improved route health signals to the preview panel.

## Changes

### New Components

| Component               | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `usePreviewPresets.ts`  | Hook for localStorage-backed preset management |
| `PresetEditorModal.tsx` | Modal for CRUD operations on presets           |

### Updated Components

| Component                   | Changes                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `/preview/page.tsx`         | Preset dropdown, route persistence, deep links, Open Current Route |
| `RouteHealthGrid.tsx`       | Redirect detection, status legend, baseUrl prop                    |
| `/api/preview/route-health` | Redirect detection, custom baseUrl support                         |

## Features

### Preset Management

- Default presets: Local, Manus, Staging
- ENV preset from `NEXT_PUBLIC_PREVIEW_URL`
- Add/edit/delete presets via modal
- Persisted in `afc_preview_presets` localStorage

### Route Persistence

- Current route saved to `afc_preview_route` localStorage
- Route restored on page load
- Route updated when clicking routes in health grid

### Deep Link Support

- `?preset=<id>` - Select a specific preset
- `?route=<path>` - Navigate to a specific route
- Combined: `?preset=staging&route=/runs`

### Improved Route Health

- Redirect detection with `redirect: 'manual'`
- Auth redirect detection (🔒 for /login, /signin, /auth)
- Non-auth redirect icon (↪️)
- Status legend at bottom of grid

## Status Icons

| Icon | Meaning                                     |
| ---- | ------------------------------------------- |
| ✅   | 200 OK                                      |
| 🔒   | Auth required (401/403 or redirect to auth) |
| ↪️   | Redirect (non-auth)                         |
| ⚠️   | 404 Not Found                               |
| ❌   | Error (500+, timeout, network)              |
| ⏳   | Loading                                     |

## Testing

- E2E tests for preset CRUD and deep links
- Manual testing with Local preset

## Evidence

- `evidence/AFC-UX-PREVIEW-1/NOTES.md`

## Acceptance Criteria

- [x] Preset dropdown with add/edit/delete
- [x] Deep link support (?preset=&route=)
- [x] Route persistence in localStorage
- [x] "Open Current Route" button
- [x] Improved redirect detection in health API
- [x] Status legend in RouteHealthGrid
- [x] E2E tests for preset CRUD and deep links
