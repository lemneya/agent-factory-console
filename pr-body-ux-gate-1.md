## Summary

Implements UX-GATE-1: Signed-out UX improvements to remove "dead lock screens" and provide a better user experience for unauthenticated users.

## Changes

### New Components

- `SignedOutCTA` - CTA panel with Sign in with GitHub, View Demo Data, Quick Setup buttons
- `DemoModeBadge` - Floating badge showing "DEMO MODE (read-only)" with exit button
- `useDemoMode` - Hook for demo mode state management

### Updated Pages

- `/runs` - SignedOutCTA + demo mode support
- `/projects` - SignedOutCTA + demo mode support
- `/blueprints` - SignedOutCTA + demo mode support (new page)
- `/workorders` - SignedOutCTA + demo mode support (new page)

### Demo Mode Mechanism

- **Activation**: Cookie `afc_demo=1` with URL param `?demo=1` fallback
- **Behavior**: Lists are read-only, mutations are disabled
- **Exit**: Click "Exit" on demo badge to clear cookie and return to CTA

### DEV Bypass

- Environment variable: `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`
- Shows "Continue as Gatekeeper (demo)" button in development only

## Testing

- E2E tests in `tests/auth-cta.spec.ts`
- Manual testing: All pages show CTA when signed out, demo mode works correctly

## Evidence

- `evidence/UX-GATE-1/NOTES.md` - Documentation of demo mode mechanism

## Acceptance Criteria

- [x] Signed-out pages show CTA panel (not dead/blank)
- [x] Demo mode renders lists read-only
- [x] Mutations remain protected
- [x] E2E tests added
- [x] Evidence committed
