# AFC-COPILOT-UX-2: Tabbed Cognitive Layout

## Summary

Implemented Zenflow-style tabbed layout for the Run detail page (`/runs/[id]`) to separate concerns into distinct cognitive surfaces:

- **Spec** - Source of truth documentation
- **Decisions** - HITL governance (questions, patches, approvals)
- **Copilot** - Freeform discussion (non-authoritative)
- **Execution** - Task progress, workers, evidence

## Implementation

### Hook: `useRunTabs` (`src/hooks/useRunTabs.ts`)

Custom hook managing tab state with dynamic default logic:

**Dynamic default algorithm:**
1. If any task has `status === "BLOCKED"` or `"BLOCKED_HITL"` → default to Decisions
2. Else if spec is missing → default to Spec
3. Else → default to Execution

**Features:**
- URL query param persistence: `?tab=spec|decisions|copilot|execution`
- localStorage persistence per runId
- When blocked tasks exist, effective tab is forced to Decisions
- Users can still click other tabs, but a banner reminds them of blocked tasks

### Components

**RunTabs** (`src/components/runs/RunTabs.tsx`)
- Tab bar with icons for each tab
- Visual indicator (pulsing dot) on Decisions tab when blocked tasks exist
- Banner when viewing other tabs with blocked tasks: "Go to Decisions"

**SpecTab** (`src/components/runs/SpecTab.tsx`)
- Displays specification markdown
- Empty state guidance when no spec exists
- "Source of Truth" badge

**DecisionsTab** (`src/components/runs/DecisionsTab.tsx`)
- Wraps CopilotHITLPanel from AFC-COPILOT-UX-1
- Header with governance description
- Empty state when no pending decisions

**CopilotTab** (`src/components/runs/CopilotTab.tsx`)
- Placeholder for freeform discussion
- "Non-authoritative" badge
- Info banner explaining this is discussion, not decision surface
- Disabled chat input (functionality coming soon)

**ExecutionTab** (`src/components/runs/ExecutionTab.tsx`)
- Contains the kanban board (TODO/DOING/BLOCKED/DONE columns)
- Ralph Mode Panel
- Memory Panel
- Task cards with move/delete actions

### Page Update

**Run Detail Page** (`src/app/runs/[id]/page.tsx`)
- Refactored to use tabbed layout
- Wrapped with Suspense for useSearchParams
- Tab content rendered based on selected tab
- CreateTaskModal accessible from header

## Tab Order

Left to right:
1. Spec (truth)
2. Decisions (HITL + patches + approvals)
3. Copilot (freeform, non-authoritative)
4. Execution (steps, workers, evidence)

## Evidence Required (Screenshots)

1. `01-tabs-header.png` - Tabs visible in page header
2. `02-spec-tab.png` - Spec tab content (empty state or with content)
3. `03-decisions-tab-hitl.png` - Decisions tab showing HITL panel
4. `04-execution-tab.png` - Execution tab showing kanban board
5. `05-blocked-forces-decisions.png` - BLOCKED_HITL forces default to Decisions

## DoD Checklist

- [x] useRunTabs hook with dynamic default logic
- [x] RunTabs component with tab bar and icons
- [x] SpecTab component with empty state
- [x] DecisionsTab component wrapping CopilotHITLPanel
- [x] CopilotTab placeholder with "non-authoritative" badge
- [x] ExecutionTab with kanban board, Ralph Mode, Memory panels
- [x] URL query param persistence (?tab=...)
- [x] localStorage persistence per runId
- [x] Forced Decisions tab when blocked tasks exist
- [x] Banner when viewing other tabs with blocked tasks
- [x] TypeScript + ESLint pass (warnings only, no errors)
