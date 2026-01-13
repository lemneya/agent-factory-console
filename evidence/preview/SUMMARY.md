# Agent Factory Console - UI Preview Evidence

**Date**: 2026-01-12  
**Branch**: `claude/afc-1-7-blueprint-slicer-fce28118`  
**Dev Server**: `http://localhost:3000`

## Dashboard Widgets Implementation

The dashboard has been updated with real data widgets following the AFC cockpit information architecture:

### Factory Status Counters
Real-time counters querying the database for:
- ADOPT, ADAPT, BUILD decision counts
- Open PRs count
- Workers online (heartbeat within 5 minutes)
- Runs active and queued
- Council blocks (BUILD with HIGH risk)
- Last webhook received timestamp

### Dashboard Panels

| Panel | Description | Data Source |
|-------|-------------|-------------|
| Active WorkOrders | Top 6 by updatedAt | WorkOrder table (PLANNED, READY, IN_PROGRESS, WAITING_FOR_APPROVAL) |
| Last Run Summary | Latest run with task stats | Run table with task aggregation |
| Memory Insights | Top 3 memory keys + hit counts | MemoryItem and MemoryUse tables |
| Activity Log | Latest 10 audit events | WorkOrderAuditEvent, RunIteration, CouncilDecision, WorkerLog |

### Quick Links
Compact navigation cards for: Projects, Runs, Blueprints, WorkOrders, Notifications

## Screenshots

1. **dashboard-widgets.png** - New dashboard with all widgets (showing error states since no DB connected)
2. **dashboard-home.png** - Original dashboard for comparison
3. **blueprints-list.png** - Blueprints list page
4. **workorders-list.png** - WorkOrders list page

## Technical Notes

All widgets display proper error states when the database is not connected, which is the expected behavior in the dev environment without a running PostgreSQL instance. When connected to a database, the widgets will display real data with:
- Auto-refresh every 30 seconds for Factory Status and Activity Log
- Proper empty states when no data exists
- Clickable links to detail pages

## Files Created

### API Routes
- `/api/dashboard/stats` - Factory status counters
- `/api/dashboard/workorders` - Active work orders
- `/api/dashboard/runs` - Last run summary
- `/api/dashboard/memory` - Memory insights
- `/api/dashboard/audit` - Activity/audit log

### Components
- `FactoryStatus.tsx` - Factory status counters widget
- `ActiveWorkOrders.tsx` - Active work orders panel
- `LastRunSummary.tsx` - Last run summary panel
- `MemoryInsights.tsx` - Memory insights panel
- `ActivityLog.tsx` - Activity/audit log panel

### Updated Pages
- `src/app/page.tsx` - Dashboard with all widgets integrated
