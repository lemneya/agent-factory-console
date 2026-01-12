# AFC-1.5 Terminal Matrix MVP - Implementation Summary

## Overview

Added a Terminal Matrix to AFC that lets you spawn/attach to long-running worker sessions and watch/intervene without leaving the dashboard.

## Key Safety Features

### 1. Read-Only by Default
- All terminal sessions start in `READ_ONLY` mode
- Users can only view output, not send input
- Prevents accidental interference with automated workflows

### 2. Break-Glass Input
- Interactive mode requires explicit "Enable Input" action
- Warning modal shown before enabling
- All mode changes are audited with user ID and reason

### 3. Full Audit Trail
- All terminal I/O recorded as `TerminalEvent` records
- Event types: `OUTPUT`, `INPUT`, `MODE_CHANGE`, `CONNECT`, `DISCONNECT`, `KILL`
- Each event includes timestamp, actor (user or agent), and sequence number

### 4. Gateway Isolation
- Terminal connections routed through `terminal-gateway` service
- No direct worker IP access from frontend
- Gateway enforces authentication and logging

## Deliverables

### A) Docker Configuration
- `docker-compose.yml` - Terminal gateway service
- `docker/terminal-gateway/` - Gateway Dockerfile and Node.js application
- `docker/worker/` - Worker template with tmux support

### B) TypeScript Types
- `TerminalSession` - Session metadata
- `TerminalEvent` - Audit log entries
- `TerminalToken` - Ephemeral auth tokens
- `TerminalMode` - `READ_ONLY` | `INTERACTIVE`
- `TerminalStatus` - `ACTIVE` | `CLOSED` | `ERROR`
- `TerminalEventType` - Event type enum

### C) API Service
- `createTerminalSession()` - Create new session (READ_ONLY default)
- `getTerminalSessions()` - List sessions for a run
- `enableInteractiveMode()` - Break-glass switch
- `sendTerminalInput()` - Send input (INTERACTIVE only)
- `killTerminalSession()` - Close session
- `getTerminalEvents()` - Get audit events
- `generateTerminalToken()` - Create ephemeral token

### D) UI Components
- `TerminalMatrix` - Grid view with spawn/kill/enable-input controls
- `TerminalView` - Terminal output display with input form
- `RunDetail` - Page with Terminals tab

### E) Tests
- 12 unit tests covering:
  - Session creation (READ_ONLY default)
  - Break-glass mode change + audit
  - Input blocking in READ_ONLY mode
  - Session kill + audit
  - Token generation with 15min expiry
  - Security constraint verification

## Hard Constraints Met

1. ✅ Terminals disabled by default in production configs
2. ✅ Default mode is READ_ONLY streaming
3. ✅ "Enable Input" is break-glass: requires confirmation + logged
4. ✅ All terminal I/O recorded to audit events
5. ✅ No weakening of Council Gate / Ralph Mode logic

## Files Modified/Created

### New Files
- `docker-compose.yml`
- `docker/terminal-gateway/Dockerfile`
- `docker/terminal-gateway/package.json`
- `docker/terminal-gateway/gateway.js`
- `docker/terminal-gateway/entrypoint.sh`
- `docker/worker/Dockerfile`
- `docker/worker/tmux.conf`
- `src/services/terminalService.ts`
- `src/components/TerminalMatrix.tsx`
- `src/components/TerminalView.tsx`
- `src/pages/RunDetail.tsx`
- `src/test/terminalService.test.ts`
- `src/test/setup.ts`
- `vitest.config.ts`

### Modified Files
- `src/types/index.ts` - Added terminal types
- `src/data/mockData.ts` - Added mock terminal data
- `src/components/index.ts` - Export terminal components
- `src/components/Button.tsx` - Added `warning` variant
- `src/components/PageHeader.tsx` - Accept ReactNode title
- `src/components/ProgressBar.tsx` - Added `lg` size
- `src/pages/index.ts` - Export RunDetail
- `src/pages/Runs.tsx` - Added navigation to run detail
- `src/App.tsx` - Added /runs/:id route
- `package.json` - Added test scripts and dependencies

## Test Results

```
✓ src/test/terminalService.test.ts (12 tests) 13ms

Test Files  1 passed (1)
Tests       12 passed (12)
```

## Usage

1. Navigate to Runs page
2. Click on a run to open Run Detail
3. Go to "Terminals" tab
4. Click spawn button to create a session
5. View terminal output in read-only mode
6. Click "Enable Input" for break-glass access (warning shown)
7. Send commands when in interactive mode
8. Click "Kill" to close session
