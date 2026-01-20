# AFC-ADAPTER-1: LangGraph PoC Adapter Host + Event Bridge

## Summary

This implements a standalone Python/FastAPI adapter host that:
- Hosts a LangGraph workflow with interrupt/resume capability
- Emits AFC-compatible events (NDJSON stream)
- Provides 5 REST endpoints for run lifecycle management
- Redacts secrets from all event payloads

**What is explicitly NOT included:** No Next.js changes, no deploy wiring, no production.

## Setup Commands

```bash
cd adapter_host

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Run the Server

```bash
cd adapter_host
source venv/bin/activate
uvicorn app.main:app --reload --port 8001
```

## Run Demo Script

In another terminal:

```bash
cd adapter_host
./demo.sh
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/runs` | Create a new run (starts execution until interrupt) |
| GET | `/runs/{run_id}` | Get run status and metadata |
| GET | `/runs/{run_id}/events` | Stream events as NDJSON |
| POST | `/runs/{run_id}/resume` | Resume a paused run |
| POST | `/runs/{run_id}/cancel` | Cancel a running/waiting run |

## Event Types (AFC-Compatible)

- `LOG` - General log message
- `STATE_UPDATE` - State changed
- `CHECKPOINT_SAVED` - Checkpoint persisted
- `INTERRUPT_REQUIRED` - Waiting for approval
- `RESUMED` - Run resumed after approval
- `COMPLETED` - Run finished successfully
- `ERROR` - Run failed with error
- `CANCELLED` - Run was cancelled

## How to Capture NDJSON Stream

```bash
# After creating a run, capture events:
curl -s http://localhost:8001/runs/<run_id>/events > emitted_events.ndjson

# Or with jq for pretty printing:
curl -s http://localhost:8001/runs/<run_id>/events | jq -c '.'
```

## Workflow

1. `POST /runs` creates a run and executes until `interrupt_before=["continue"]`
2. Run status becomes `WAITING_APPROVAL` with interrupt metadata
3. `POST /runs/{id}/resume` continues execution past the interrupt
4. Run completes with status `COMPLETED`

## Files

```
adapter_host/
├── requirements.txt       # Python dependencies
├── .gitignore            # Python-specific ignores
├── demo.sh               # Demo script
└── app/
    ├── __init__.py
    ├── main.py           # FastAPI app entry
    ├── models.py         # Pydantic models
    ├── redaction.py      # Secret redaction
    ├── store.py          # In-memory store
    ├── emitter.py        # Event emission
    ├── langgraph_poc.py  # LangGraph workflow
    └── routes/
        ├── __init__.py
        └── runs.py       # Run endpoints
```

## Evidence Files

- `local_run.log` - Output from demo.sh
- `emitted_events.ndjson` - Captured event stream
- `interrupt_resume_trace.json` - Interrupt/resume trace
- `curl_examples.md` - Example curl commands

## Verification

```bash
# Repo checks (from repo root)
npm run lint
npm run typecheck
npm test
npm run build

# Local proof
cd adapter_host
source venv/bin/activate
uvicorn app.main:app --port 8001 &
./demo.sh | tee ../evidence/AFC-ADAPTER-1/local_run.log
```

## Sign-off

- Executor: Claude Code (Track B)
- Date: 2026-01-20
- Status: PoC Complete
