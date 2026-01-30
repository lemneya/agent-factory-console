# AFC-C2-STREAM-0: C2 Dashboard Evidence

## Implementation Summary

This gate implements the Command & Control (C2) dashboard for real-time multi-agent swarm orchestration.

### Features Implemented

1. **3-Pane Layout**
   - **Brain Panel** (left): Session info, status, controls (Start/Stop simulation)
   - **Swarm Grid** (center): 5x4 grid of 20 agents with real-time state visualization
   - **Vault Panel** (right): Generated artifacts list with preview selection

2. **Ops Console** (bottom): Real-time log stream with color-coded levels

3. **SSE Streaming**
   - `GET /api/c2/stream?sessionId=...` - Real-time event stream
   - Session-scoped in-memory pubsub (acceptable for this gate)
   - Keepalive ping every 15 seconds

4. **Deterministic 30-Second Simulation**
   - 20 agents in 5x4 grid
   - State updates every 500ms
   - Progress updates every 2s
   - Artifacts generated at ~10s, 20s, 28s
   - Stop/abort supported

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/c2/sessions` | Create a new C2 session |
| GET | `/api/c2/sessions` | List C2 sessions |
| GET | `/api/c2/sessions/[id]` | Get session details |
| POST | `/api/c2/sessions/[id]/events` | Add event to session |
| GET | `/api/c2/stream?sessionId=...` | SSE event stream |
| POST | `/api/c2/sessions/[id]/simulate/start` | Start simulation |
| POST | `/api/c2/sessions/[id]/simulate/stop` | Stop simulation |

### Prisma Models

- `C2Session` - Session tracking with status, agent configuration
- `C2Event` - Event log with typed events and metadata
- `C2Artifact` - Generated artifacts during simulation

### Enums

- `C2SessionStatus`: IDLE, RUNNING, PAUSED, COMPLETED, ABORTED
- `C2EventType`: SESSION_START, SESSION_STOP, SESSION_ABORT, AGENT_STATE, PROGRESS, LOG, ARTIFACT_CREATED, PING
- `C2AgentState`: IDLE, THINKING, WORKING, DONE, ERROR
- `C2ArtifactType`: CODE, DOCUMENT, CONFIG, LOG, REPORT, OTHER

### Security

All endpoints enforce auth + ownership via existing auth helpers:
- `requireAuth()` for authentication
- `requireC2SessionOwnership()` for session access control

## Verification Checklist

- [ ] `/c2` renders 3-pane layout + ops console
- [ ] SSE stream connects and receives events
- [ ] "Simulate Swarm" runs ~30s, updates agent grid, progress, logs
- [ ] Artifacts appear at ~10s, ~20s, ~28s
- [ ] "Abort" stops simulation early

## Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Then navigate to `http://localhost:3000/c2`

## Files Changed

- `prisma/schema.prisma` - Added C2Session, C2Event, C2Artifact models + enums
- `src/lib/auth-helpers.ts` - Added requireC2SessionOwnership
- `src/lib/c2-pubsub.ts` - Session-scoped SSE pubsub
- `src/lib/c2-simulation.ts` - Deterministic swarm simulation
- `src/app/api/c2/**` - API routes
- `src/app/c2/page.tsx` - C2 dashboard page
- `src/components/c2/**` - UI components
- `src/config/nav.tsx` - Added C2 nav entry
