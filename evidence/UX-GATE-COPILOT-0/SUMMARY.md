# UX-GATE-COPILOT-0: Copilot Chat (Read-only + Cited Answers + Audit)

## What Shipped

### Navigation

- Added Copilot nav item in `src/config/nav.tsx`
- Key: `copilot`, Label: `Copilot`, Href: `/copilot`
- Sparkles icon for visual distinction
- Sidebar renders with `data-testid="nav-copilot"`

### Copilot Page (`/copilot`)

- 2-column layout: Chat (left) + Context panel (right)
- Page shell with `data-testid="page-root"` and `data-testid="page-title"`
- Chat panel with message list, input, and send button
- Test IDs: `copilot-chat`, `copilot-input`, `copilot-send`

### Context Panel

- Scope selector: Global (default), Project, Run
- Quick prompt buttons:
  - "Explain Council Gate"
  - "Explain Ralph Mode"
  - "How do I start a BUILD run?"
  - "What is a Blueprint and Slicer?"
- Test ID: `copilot-context`

### Sources Panel

- Each assistant answer shows "Sources" list
- Clickable items expand to show snippet
- Test ID: `copilot-sources`
- Shows "No sources available" message when empty

### Demo Mode

- Navigate to `/copilot?demo=1` for demo mode
- Shows "DEMO (read-only)" badge
- Docs-only responses (no DB access)

### Signed-Out UX

- Non-demo signed-out users see SignedOutCTA
- Prevents dead page state

## Backend: Copilot API (READ-ONLY)

### Route: `POST /api/copilot/chat`

Request:

```json
{
  "message": "string",
  "projectId": "string|null",
  "runId": "string|null",
  "mode": "ASK",
  "demoMode": true|false
}
```

Response:

```json
{
  "answer": "string",
  "sources": [
    {
      "type": "DOC",
      "ref": "docs/gate-policy.md#council",
      "title": "Council Gate",
      "snippet": "..."
    },
    { "type": "DB", "ref": "Project:<id>", "title": "Project record", "snippet": "..." }
  ],
  "dbAvailable": true,
  "llmUsed": false
}
```

### Hard Constraints Enforced

- MUST NOT write to any tables except CopilotMessage audit log
- MUST NOT call: /api/runs POST, worker endpoints, terminal endpoints
- MUST NOT create/update/delete except audit logging

### Error Behavior

- LLM not configured → returns 200 with docs-only answer
- DB not reachable → returns 200 with docs-only answer + "DB unavailable" note

## Knowledge Retrieval

### Docs Allowlist Loader (`src/knowledge/docsLoader.ts`)

- Reads only allowed files:
  - README.md
  - docs/gate-policy.md
  - coordination/DECISIONS.md
  - coordination/AGENT_STATUS.md
  - evidence/\*\*/SUMMARY.md
  - evidence/UX-GATE-_/_.md
- Splits by headings (#, ##)
- Each chunk: ref, title, text (capped at ~1200 chars)
- Retrieval: keyword overlap scoring, returns top 5

### DB Context Reader (`src/knowledge/dbContext.ts`)

- Demo mode: no DB access
- Project scope: project record, last 5 runs, latest council decision, last 5 workorders
- Run scope: run record, last checkpoint, last 20 logs, Ralph policy

## LLM Provider (`src/services/llm/provider.ts`)

- Environment: OPENAI_API_KEY, OPENAI_MODEL (default: gpt-4o-mini)
- No key: responds docs-only (still useful)
- With key: calls OpenAI with system prompt enforcing read-only
- Citations only refer to retrieved items (not hallucinated)

## Audit Logging

### Prisma Model: CopilotMessage

- id, createdAt
- userId (nullable if demo/signed-out)
- projectId, runId (nullable scope context)
- role: USER | ASSISTANT
- content: string
- sourcesJson: JSON (nullable)

Logs both user messages and assistant responses with sources.

## Tests

### Unit Tests (`src/knowledge/docsLoader.test.ts`)

- 13 tests covering:
  - splitByHeadings: heading parsing, truncation, slugification
  - retrieveChunks: keyword matching, top-k, case insensitivity

### E2E Tests (`tests/copilot.spec.ts`)

- Route exists and shows page shell
- Copilot appears in sidebar navigation
- Demo mode shows badge
- Can type and send messages
- Sources block appears after answer
- Context panel and quick prompts work
- Signed-out non-demo shows CTA
- Read-only info displayed

## How to Test

1. **Demo Mode**: Navigate to `/copilot?demo=1`
   - Type a question and click Send
   - Verify answer appears with sources

2. **Quick Prompts**: Click any quick prompt button
   - Verify question is sent and answered

3. **Scope Selection**: Change scope to Project/Run
   - Enter a project/run ID
   - Ask a question to see scoped context

4. **Signed-Out**: Navigate to `/copilot` without auth
   - Verify SignedOutCTA appears

5. **Run E2E Tests**:

   ```bash
   npm run test:e2e -- tests/copilot.spec.ts
   ```

6. **Run Unit Tests**:
   ```bash
   npm run test:vitest -- --run src/knowledge/docsLoader.test.ts
   ```

## Files Changed

### New Files

- `src/app/copilot/page.tsx` - Copilot page component
- `src/app/api/copilot/chat/route.ts` - Copilot API route
- `src/knowledge/docsLoader.ts` - Docs allowlist loader
- `src/knowledge/docsLoader.test.ts` - Unit tests
- `src/knowledge/dbContext.ts` - DB context reader
- `src/services/llm/provider.ts` - LLM provider
- `src/components/copilot/` - Copilot UI components
- `tests/copilot.spec.ts` - E2E tests
- `evidence/UX-GATE-COPILOT-0/` - This evidence folder

### Modified Files

- `src/config/nav.tsx` - Added Copilot nav item
- `prisma/schema.prisma` - Added CopilotMessage model

## Acceptance Criteria

- [x] Copilot link appears in sidebar (NAV_ITEMS)
- [x] /copilot page works with proper UX shell
- [x] Demo mode works with docs-only responses
- [x] Signed-out shows CTA (not dead page)
- [x] Each assistant answer shows "Sources"
- [x] Read-only enforced: no run/project mutations
- [x] Copilot audit rows stored when DB available
- [x] CI green (lint/test/typecheck/build/e2e/docker)
- [x] Evidence committed
