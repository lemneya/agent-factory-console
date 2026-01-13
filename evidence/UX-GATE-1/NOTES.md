# UX-GATE-1: Signed-out UX Evidence

## Demo Mode Mechanism

**Implementation**: Cookie-based with URL parameter fallback

### How Demo Mode Works

1. **Activation Methods**:
   - Click "View Demo Data (read-only)" button → sets `afc_demo=1` cookie + navigates to `?demo=1`
   - Click "Continue as Gatekeeper (demo)" (DEV-only) → same behavior
   - Direct URL navigation to any page with `?demo=1` parameter

2. **Detection Logic** (`useDemoMode` hook):
   ```typescript
   // Check URL param first
   const demoParam = searchParams.get('demo');
   // Check cookie
   const cookieMatch = document.cookie.match(/afc_demo=1/);
   // Demo mode is ON if either is true
   const isInDemoMode = demoParam === '1' || !!cookieMatch;
   ```

3. **Cookie Details**:
   - Name: `afc_demo`
   - Value: `1`
   - Path: `/`
   - Max-age: `86400` (24 hours)

4. **Exit Demo Mode**:
   - Click "Exit" on the demo badge
   - Clears cookie and removes URL param

### Behavior in Demo Mode

| Feature | Demo Mode | Authenticated |
|---------|-----------|---------------|
| View lists | ✅ Allowed | ✅ Allowed |
| View details | ✅ Allowed | ✅ Allowed |
| Create/Edit | ❌ Disabled | ✅ Allowed |
| Delete | ❌ Disabled | ✅ Allowed |
| Sync repos | ❌ Disabled | ✅ Allowed |

### DEV Bypass

- Environment variable: `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`
- Only visible in development builds
- Shows yellow "Continue as Gatekeeper (demo)" button
- Production builds hide this option

## Components Created

1. `src/components/auth/SignedOutCTA.tsx` - CTA panel with 3-4 buttons
2. `src/components/auth/DemoModeBadge.tsx` - Floating badge for demo mode
3. `src/components/auth/useDemoMode.ts` - Hook for demo mode detection

## Pages Updated

- `/runs` - SignedOutCTA + demo mode support
- `/projects` - SignedOutCTA + demo mode support
- `/blueprints` - SignedOutCTA + demo mode support
- `/workorders` - SignedOutCTA + demo mode support

## E2E Tests

- `tests/auth-cta.spec.ts` - Tests for CTA panel and demo mode

## Screenshots

- `signed-out-runs.png` - Runs page with CTA panel
- `demo-mode-runs.png` - Runs page in demo mode with badge
