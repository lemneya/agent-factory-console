# UX-GATE-0: Navigation Routes Checklist

**Date**: 2026-01-12  
**Branch**: `claude/ux-gate-0-nav-foundation-49a5`

## Routes Verification

All 10 routes render successfully with proper page shells:

| # | Route | Label | data-testid | Status |
|---|-------|-------|-------------|--------|
| 1 | `/` | Dashboard | page-root, page-title | ✅ Renders successfully |
| 2 | `/projects` | Projects | page-root, page-title | ✅ Renders successfully |
| 3 | `/runs` | Runs | page-root, page-title | ✅ Renders successfully |
| 4 | `/blueprints` | Blueprints | page-root, page-title | ✅ Renders successfully |
| 5 | `/workorders` | WorkOrders | page-root, page-title | ✅ Renders successfully |
| 6 | `/assets` | Assets | page-root, page-title | ✅ Renders successfully |
| 7 | `/council` | Council | page-root, page-title | ✅ Renders successfully |
| 8 | `/memory` | Memory | page-root, page-title | ✅ Renders successfully |
| 9 | `/audit` | Audit Trail | page-root, page-title | ✅ Renders successfully |
| 10 | `/notifications` | Notifications | page-root, page-title | ✅ Renders successfully |

## Implementation Details

### Navigation Config
- **File**: `src/config/nav.ts`
- **Export**: `NAV_ITEMS` array with 10 items
- **Fields**: key, label, href, icon, requiresAuth, description

### Sidebar
- **File**: `src/components/layout/Sidebar.tsx`
- **Uses**: `NAV_ITEMS` from config (no hardcoded links)
- **Test IDs**: `sidebar-nav`, `nav-{key}` for each item

### Dashboard Quick Links
- **File**: `src/app/page.tsx`
- **Uses**: `NAV_ITEMS` from config (excludes dashboard)
- **Test IDs**: `quick-link-{key}` for each item

### Page Shells
Each page has:
- `data-testid="page-root"` wrapper
- `data-testid="page-title"` on H1
- Primary CTA button (Back to Dashboard for new pages)

## Acceptance Criteria

- [x] Sidebar contains all 10 nav items (in specified order)
- [x] Dashboard quick links route correctly (no 404)
- [x] Visiting each route renders a page shell with a title
- [x] E2E nav smoke test created: `tests/nav-smoke.spec.ts`
- [x] Evidence folder committed
