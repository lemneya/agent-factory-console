# ROUTE-HEALTH-NET-0: Same-origin Route Health probes + localhost mismatch warning

## Problem Solved

Route Health showed 0ms latency / network error when the UI was accessed from a non-local origin (ngrok / remote host) while probes targeted `http://localhost:3000`. The browser couldn't reach that target from a different origin → connection failure.

## Solution

### A) Base URL Resolution (`src/lib/probe-url-resolver.ts`)

Created `resolveProbeBaseUrl()` function with the following rules:

- If `baseUrl` is provided and non-empty → use it
- Else → use `window.location.origin` (same-origin default)

### B) Localhost Mismatch Warning

Added detection logic:

- If resolved baseUrl hostname is `localhost` or `127.0.0.1`
- AND `window.location.hostname` is NOT localhost/127.0.0.1
- Show warning banner: "Route health is probing localhost from a non-local origin. Use same-origin or update base URL preset."

### C) Network Error Hinting

When probe fails with `status === 0` or fetch throws:

- If localhost mismatch detected: "Network error (baseUrl mismatch: probing localhost from non-local origin)"
- Otherwise: "Network error (possible baseUrl mismatch)"

## Files Changed

1. **`src/lib/probe-url-resolver.ts`** (NEW)
   - `isLocalhostHostname()` - Check if hostname is localhost variant
   - `extractHostname()` - Extract hostname from URL
   - `resolveProbeBaseUrl()` - Resolve probe base URL with same-origin default
   - `detectLocalhostMismatch()` - Detect localhost mismatch
   - `getProbeUrlResult()` - Get full result with mismatch warning
   - `getNetworkErrorHint()` - Get enhanced network error hint

2. **`src/components/preview/RouteHealthGrid.tsx`** (MODIFIED)
   - Uses `getProbeUrlResult()` to resolve base URL
   - Passes resolved URL to route health API
   - Shows warning banner when localhost mismatch detected
   - Enhanced error hints for network errors

3. **`__tests__/lib/probe-url-resolver.test.ts`** (NEW)
   - 33 unit tests covering all functions and edge cases

## How to Verify

### Prerequisites

1. Run the app: `npm run dev`
2. Expose via ngrok: `ngrok http 3000`
3. Open the ngrok URL in browser

### Test Steps

1. **Same-origin OK** (no baseUrl preset override):
   - Open the Preview page via ngrok URL
   - Route Health should probe the same ngrok origin
   - Routes should show non-zero latency (not 0ms)
   - No warning banner should appear
   - Screenshot: `same_origin_ok.png`

2. **Localhost Mismatch Warning** (baseUrl preset = localhost):
   - Open the Preview page via ngrok URL
   - Edit presets and set a preset URL to `http://localhost:3000`
   - Select that preset
   - Warning banner should appear: "Route health is probing localhost from a non-local origin..."
   - Routes will likely show 0ms latency / Error
   - Screenshot: `localhost_mismatch_warning.png`

## Unit Test Results

```
PASS __tests__/lib/probe-url-resolver.test.ts
  Probe URL Resolver
    isLocalhostHostname
      ✓ should return true for "localhost"
      ✓ should return true for "127.0.0.1"
      ✓ should return true for "0.0.0.0"
      ✓ should return true for "::1" (IPv6 localhost)
      ✓ should return true for "LOCALHOST" (case insensitive)
      ✓ should return false for external hostname
      ✓ should return false for ngrok hostname
      ✓ should return false for IP address that is not localhost
    extractHostname
      ✓ should extract hostname from valid URL
      ✓ should extract hostname from HTTPS URL
      ✓ should extract hostname from URL with port
      ✓ should return null for invalid URL
      ✓ should return null for empty string
    resolveProbeBaseUrl
      ✓ should return provided baseUrl when non-empty
      ✓ should trim whitespace from provided baseUrl
      ✓ should return window.location.origin when baseUrl is empty
      ✓ should return window.location.origin when baseUrl is undefined
      ✓ should return fallback when window is undefined (SSR)
      ✓ should prefer provided baseUrl over window.location.origin
    detectLocalhostMismatch
      ✓ should return true when probing localhost from non-localhost origin
      ✓ should return true when probing 127.0.0.1 from non-localhost origin
      ✓ should return false when probing localhost from localhost
      ✓ should return false when probing 127.0.0.1 from 127.0.0.1
      ✓ should return false when probing external URL from non-localhost
      ✓ should return false when probing external URL from localhost
      ✓ should return false when window is undefined (SSR)
      ✓ should return false for invalid URL
    getProbeUrlResult
      ✓ should return mismatch warning when localhost mismatch detected
      ✓ should return no warning when same-origin is used
      ✓ should return no warning when on localhost probing localhost
    getNetworkErrorHint
      ✓ should return specific hint when localhost mismatch detected
      ✓ should return generic hint when no mismatch
      ✓ should return generic hint for external URL from non-localhost

Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
```

## Screenshots

- `same_origin_ok.png` - Route Health working with same-origin probes from ngrok
- `localhost_mismatch_warning.png` - Warning banner when localhost mismatch detected
