# AFC-AUTH-UI-1: Auth-aware Route Health (401/403 → Lock)

## Implementation Summary

### Problem Solved

Route Health previously showed ❌ Error for protected routes when the user was signed out. This was misleading because a 401/403 response is actually auth working correctly, not an error.

### Solution

Created a single classifier function that categorizes route health outcomes:

| Status Code                        | Classification | Icon | Label         |
| ---------------------------------- | -------------- | ---- | ------------- |
| 200                                | HEALTHY        | ✅   | Healthy       |
| 401, 403                           | AUTH_REQUIRED  | 🔒   | Auth required |
| 404                                | ERROR          | ❌   | Error         |
| 5xx                                | ERROR          | ❌   | Error         |
| Network/timeout                    | ERROR          | ❌   | Error         |
| Redirect to /login, /signin, /auth | AUTH_REQUIRED  | 🔒   | Auth required |

### Files Changed

1. **`src/lib/route-health-classifier.ts`** (NEW)
   - `classifyRouteHealth()` - Main classifier function
   - `getStatusIcon()` - Returns emoji icon for status
   - `getStatusLabel()` - Returns display label for status
   - `getStatusColorClass()` - Returns Tailwind color class
   - `getStatusTooltip()` - Returns tooltip text (for auth required)

2. **`src/components/preview/RouteHealthGrid.tsx`** (MODIFIED)
   - Refactored to use the new classifier
   - Updated legend to show new status labels
   - Added tooltip "Sign in to check this route." for auth required status

3. **`__tests__/lib/route-health-classifier.test.ts`** (NEW)
   - 35 unit tests covering all status codes and edge cases

## How to Verify

### Prerequisites

1. Run the app: `npm run dev`
2. Navigate to the Preview page: http://localhost:3000/preview

### Test Steps

1. **Signed Out** (no session):
   - Open the Preview page
   - Route Health should show 🔒 "Auth required" for protected routes
   - Screenshot saved as: `signed_out_route_health.png`

2. **Signed In** (with valid session):
   - Sign in via GitHub OAuth
   - Open the Preview page
   - Route Health should show ✅ "Healthy" for the same routes
   - Screenshot saved as: `signed_in_route_health.png`

### Expected Behavior

| Route       | Signed Out       | Signed In  |
| ----------- | ---------------- | ---------- |
| /runs       | 🔒 Auth required | ✅ Healthy |
| /projects   | 🔒 Auth required | ✅ Healthy |
| /blueprints | 🔒 Auth required | ✅ Healthy |
| /workorders | 🔒 Auth required | ✅ Healthy |
| /copilot    | 🔒 Auth required | ✅ Healthy |

## Unit Test Results

```
PASS __tests__/lib/route-health-classifier.test.ts
  Route Health Classifier
    classifyRouteHealth
      ✓ should return LOADING for null health data
      ✓ should return HEALTHY for status 200
      ✓ should return AUTH_REQUIRED for status 401
      ✓ should return AUTH_REQUIRED for status 403
      ✓ should return ERROR for status 404
      ✓ should return ERROR for status 500
      ✓ should return ERROR for network error (status 0)
      ✓ should return ERROR for timeout (status 0 with error)
      ✓ should return AUTH_REQUIRED for redirect to /login
      ... (35 tests total)

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
```

## Screenshots

Screenshots to be captured:

- `signed_out_route_health.png` - Route Health showing 🔒 for protected routes when signed out
- `signed_in_route_health.png` - Route Health showing ✅ for same routes when signed in
