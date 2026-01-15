# AFC-UX-PREVIEW-2: Cross-Env Preview Launcher

## Overview

This feature implements a comprehensive cross-environment preview system for the Agent Factory Console, enabling users to quickly preview any page across different environments (local, staging, production).

## Features Implemented

### 1. Global Preview Launcher Button

**Location:** Header (DashboardLayout)

**Component:** `src/components/preview/PreviewLauncher.tsx`

**Functionality:**
- Displays in the header on all pages
- Shows current preset (e.g., "local", "staging")
- Clicking navigates to `/preview` with current path and preset
- Includes tooltip on hover

**Test IDs:**
- `preview-launcher-btn` - Main button
- `preview-launcher-preset` - Preset badge

### 2. Open in Preview Row Actions

**Components:**
- `src/components/preview/OpenInPreview.tsx` - Reusable row action component
- Added to `src/app/runs/page.tsx` - Runs list
- Added to `src/app/projects/page.tsx` - Projects list

**Functionality:**
- "Preview" button in each row's Actions column
- Opens the specific item in Preview page
- Includes tooltip showing target preset

**Test IDs:**
- `open-in-preview-{entity}-{id}` - Row action button

### 3. Route Health Grid Enhancements

**Component:** `src/components/preview/RouteHealthGrid.tsx`

**New Features:**
- **Expandable rows** - Click chevron to expand/collapse details
- **Detailed info panel** - Shows status, latency, redirect URL, error, content-type, size
- **Latency color coding** - Green (<100ms), Yellow (<300ms), Red (>300ms)
- **Tooltips** - "Load in iframe" tooltip on Open button

**Test IDs:**
- `route-expand-{key}` - Expand/collapse button
- `route-details-{key}` - Details panel
- `route-open-{key}` - Open button

### 4. Tooltips

All preview-related actions include hover tooltips:
- Preview Launcher: "Open in Preview ({preset})"
- Open in Preview: "Open in Preview ({preset})"
- Route Health Open: "Load in iframe"

## Files Changed

| File | Changes |
|------|---------|
| `src/components/preview/PreviewLauncher.tsx` | New - Global preview button |
| `src/components/preview/OpenInPreview.tsx` | New - Row action component |
| `src/components/preview/RouteHealthGrid.tsx` | Enhanced - Expandable details |
| `src/components/preview/index.ts` | Updated - New exports |
| `src/components/layout/DashboardLayout.tsx` | Updated - Added PreviewLauncher |
| `src/app/runs/page.tsx` | Updated - Added Actions column |
| `src/app/projects/page.tsx` | Updated - Added Preview button |
| `tests/afc-ux-preview-2.spec.ts` | New - E2E tests |

## E2E Tests

**File:** `tests/afc-ux-preview-2.spec.ts`

**Test Suites:**
1. Global Preview Launcher Button (3 tests)
2. Open in Preview Row Actions (2 tests)
3. Route Health Grid (4 tests)
4. Tooltips (1 test)
5. Preview Page Integration (3 tests)

## Verification

```bash
# Typecheck
npm run typecheck  # ✅ Pass

# Build
npm run build      # ✅ Pass
```

## Usage

### Global Preview Launcher
1. Navigate to any page (e.g., `/runs`)
2. Click "Preview" button in header
3. Opens `/preview?path=/runs&preset=local`

### Row Actions
1. Navigate to Runs or Projects list
2. Find the "Preview" button in the Actions column
3. Click to open that specific item in Preview

### Route Health Details
1. Navigate to `/preview`
2. Click the chevron (▶) next to any route
3. View detailed health information
4. Click again to collapse

## Date

2026-01-15
