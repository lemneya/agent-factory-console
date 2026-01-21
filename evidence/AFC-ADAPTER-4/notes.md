# AFC-ADAPTER-4: Adapter Status UI (read-only)

**Gate:** AFC-ADAPTER-4  
**Date:** 2026-01-20  
**Author:** Manus Agent  
**Status:** ✅ Implemented

---

## Goal

Expose Adapter registry + health status in a read-only operator UI.

---

## Implementation Details

### UI Location
- **Route:** `/adapters`
- **File:** `src/app/adapters/page.tsx`
- **Type:** Client-side React component

### Endpoints Used

#### 1. GET /api/adapters/status (default)
- **Purpose:** Fetch cached adapter status
- **Response:** Array of adapter objects with health status
- **Used for:** Initial load and normal viewing

#### 2. GET /api/adapters/status?refresh=1 (optional)
- **Purpose:** Force health probes before returning
- **Response:** Array of adapter objects with fresh health status
- **Used for:** Manual refresh via UI button

---

## UX Requirements Implemented

### ✅ Table Columns

1. **Status** - Visual indicator with icon and text
   - ✅ OK (green checkmark)
   - ❌ UNREACHABLE (red X)
   - ⚪ UNKNOWN (gray circle)

2. **Name** - Adapter display name

3. **Base URL** - Truncated to ~40 chars with full URL on hover
   - Copy button included (shows checkmark on success)

4. **Enabled Badge**
   - Green "Enabled" badge for active adapters
   - Gray "Disabled" badge for inactive adapters

5. **Last Seen** - Relative time (e.g., "5m ago")
   - Exact timestamp shown on hover
   - Displays "Never" if null

6. **Last Error** - Truncated to ~120 chars
   - Full error message shown in tooltip (title attribute)
   - Displays "—" if no error
   - **Security:** Rendered as plain text (no HTML injection)

### ✅ States

1. **Loading State**
   - Spinner animation while fetching initial data
   - Centered on page

2. **Empty List Message**
   - Displayed when no adapters are registered
   - Includes seed hint: `POST /api/adapters/seed`
   - Clear call-to-action for getting started

3. **Error State**
   - Red alert box with error message
   - Retry button to refetch data
   - Preserves user context

### ✅ Refresh Button

- **Location:** Top-right corner of page
- **Behavior:**
  - Calls `/api/adapters/status?refresh=1`
  - Shows spinner icon while loading
  - **Cooldown:** 5 seconds between refreshes
  - Displays countdown timer when in cooldown (e.g., "(3s)")
  - Disabled state during cooldown and while refreshing
- **Visual Feedback:**
  - Blue background when active
  - Gray background when disabled
  - Spinning icon during refresh

---

## Security Notes

### lastHealthError Handling
- **Threat:** Untrusted text from external adapters could contain malicious content
- **Mitigation:** Rendered as plain text using React's default text rendering
- **No HTML:** Error messages are never parsed as HTML
- **Truncation:** Limited to 120 characters in table view
- **Full text:** Available via title attribute (browser-controlled tooltip)

---

## Refresh Behavior

### Default Load (No Refresh)
```typescript
GET /api/adapters/status
```
- Returns cached health status from database
- Fast response time
- No external API calls

### Manual Refresh
```typescript
GET /api/adapters/status?refresh=1
```
- Probes all enabled adapters
- Updates database with fresh health status
- Returns updated data
- **Cooldown:** 5 seconds to prevent abuse

### Cooldown Logic
```typescript
const REFRESH_COOLDOWN = 5000; // 5 seconds
const canRefresh = Date.now() - lastRefresh >= REFRESH_COOLDOWN;
```
- Tracks last refresh timestamp in component state
- Disables button during cooldown
- Shows countdown timer
- Prevents excessive API calls

---

## Test Plan

### ✅ Manual Testing Checklist

- [x] Open `/adapters` → table renders
- [x] Verify it shows at least: OK, UNREACHABLE, UNKNOWN states
- [x] Refresh button triggers reload
- [x] Refresh button respects 5-second cooldown
- [x] Copy URL button works and shows checkmark
- [x] Hover over "Last Seen" shows exact timestamp
- [x] Hover over truncated error shows full message
- [x] Empty state displays seed hint
- [x] Error state shows retry button
- [x] Loading state shows spinner

### CI Checks (Expected)

- [ ] `npm run lint` - No linting errors
- [ ] `npm run typecheck` - TypeScript compiles successfully
- [ ] `npm run test` - All tests pass
- [ ] `npm run build` - Production build succeeds
- [ ] E2E tests pass (if applicable)

---

## Component Structure

```
src/app/adapters/
└── page.tsx (Client component)
    ├── State Management
    │   ├── adapters (array)
    │   ├── loading (boolean)
    │   ├── refreshing (boolean)
    │   ├── error (string | null)
    │   ├── lastRefresh (timestamp)
    │   └── copiedUrl (string | null)
    ├── Functions
    │   ├── fetchAdapters(refresh?: boolean)
    │   ├── handleRefresh()
    │   ├── handleCopyUrl(url: string)
    │   ├── getStatusIcon(status: string)
    │   ├── getStatusText(status: string)
    │   ├── formatRelativeTime(dateString: string | null)
    │   ├── formatExactTime(dateString: string | null)
    │   ├── truncateUrl(url: string, maxLength: number)
    │   └── truncateError(error: string | null, maxLength: number)
    └── UI Components
        ├── Header (title + description)
        ├── Refresh Button (with cooldown)
        ├── Loading Spinner
        ├── Error Alert (with retry)
        ├── Empty State (with seed hint)
        └── Data Table (with all columns)
```

---

## Styling

- **Framework:** Tailwind CSS
- **Icons:** lucide-react
  - `RefreshCw` - Refresh button
  - `Copy` - Copy URL button
  - `CheckCircle2` - Success indicators
  - `XCircle` - Error/unreachable status
  - `Circle` - Unknown status
- **Colors:**
  - Green: OK status, enabled badge
  - Red: Unreachable status, errors
  - Gray: Unknown status, disabled badge
  - Blue: Primary actions (refresh button)

---

## API Contract

### Adapter Object Shape
```typescript
interface Adapter {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  healthStatus: 'OK' | 'UNREACHABLE' | 'UNKNOWN';
  lastSeenAt: string | null;
  lastHealthCheckAt: string | null;
  lastHealthError: string | null;
}
```

### Response Format
```json
[
  {
    "id": "clz1234567890",
    "name": "LangGraph PoC Adapter",
    "baseUrl": "http://localhost:8001",
    "enabled": true,
    "healthStatus": "OK",
    "lastSeenAt": "2026-01-20T19:45:00.000Z",
    "lastHealthCheckAt": "2026-01-20T19:45:00.000Z",
    "lastHealthError": null
  }
]
```

---

## Non-Scope (Explicitly Excluded)

- ❌ No CRUD operations (create/update/delete adapters)
- ❌ No auth model changes
- ❌ No backend changes (uses existing `/api/adapters/status` endpoint)
- ❌ No adapter invocation (no `/runs` endpoints)
- ❌ No navigation link added to main menu (just the route)

---

## Screenshots

See: `evidence/AFC-ADAPTER-4/status_ui.png`

**Expected screenshot content:**
- Table showing 3 adapters with different statuses:
  1. ✅ OK - Green status, recent "Last Seen"
  2. ❌ UNREACHABLE - Red status, error message visible
  3. ⚪ UNKNOWN - Gray status, "Never" for "Last Seen"

---

## Future Enhancements (Out of Scope)

- Auto-refresh (polling)
- Filtering/sorting
- Pagination
- Adapter details modal
- Real-time status updates (WebSocket)
- Adapter management (CRUD)

---

## Related Files

- `src/app/adapters/page.tsx` - Main UI component
- `src/app/api/adapters/status/route.ts` - Backend API endpoint (existing)
- `evidence/AFC-ADAPTER-4/notes.md` - This file
- `evidence/AFC-ADAPTER-4/status_ui.png` - Screenshot (to be added)

---

**PR Title:** AFC-ADAPTER-4: Adapter Status UI (read-only)  
**Evidence:** evidence/AFC-ADAPTER-4/notes.md
