## Summary

UX-GATE-0: Navigation Foundation - Single source of truth for all navigation items with proper page shells.

## Changes

### Navigation Config

- **New file**: `src/config/nav.tsx`
- Exports `NAV_ITEMS` array with all 10 navigation items
- Exports `getNavItem(key)` helper function
- Each item has: key, label, href, icon, requiresAuth, description

### Sidebar

- Updated `src/components/layout/Sidebar.tsx` to use `NAV_ITEMS`
- No more hardcoded links
- Added `data-testid="sidebar-nav"` and `data-testid="nav-{key}"` for each item

### Dashboard Quick Links

- Updated `src/app/page.tsx` to use `NAV_ITEMS`
- Added `data-testid="quick-link-{key}"` for each item

### Route Pages (10 total)

All pages have proper page shells with:

- `data-testid="page-root"` wrapper
- `data-testid="page-title"` on H1
- Primary CTA button

| Route            | Label         | Status      |
| ---------------- | ------------- | ----------- |
| `/`              | Dashboard     | ✅ Updated  |
| `/projects`      | Projects      | ✅ Existing |
| `/runs`          | Runs          | ✅ Existing |
| `/blueprints`    | Blueprints    | ✅ New      |
| `/workorders`    | WorkOrders    | ✅ New      |
| `/assets`        | Assets        | ✅ New      |
| `/council`       | Council       | ✅ Updated  |
| `/memory`        | Memory        | ✅ New      |
| `/audit`         | Audit Trail   | ✅ New      |
| `/notifications` | Notifications | ✅ Existing |

### E2E Test

- **New file**: `tests/nav-smoke.spec.ts`
- Tests sidebar contains all 10 nav items
- Tests dashboard quick links route correctly
- Tests each route renders with page shell and title
- Tests clicking each sidebar link navigates correctly

### Evidence

- **New file**: `evidence/UX-GATE-0/ROUTES.md`

## Acceptance Criteria

- [x] Sidebar contains all 10 nav items (in specified order)
- [x] Dashboard quick links route correctly (no 404)
- [x] Visiting each route renders a page shell with a title
- [x] E2E nav smoke test created
- [x] Evidence folder committed

## Testing

```bash
npm run lint    # ✅ Passes
npm run test    # ✅ Passes
npm run build   # ✅ Passes
```
