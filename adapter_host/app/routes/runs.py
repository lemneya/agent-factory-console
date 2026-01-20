from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json

from app.models import (
    RunCreateRequest,
    RunCreateResponse,
    RunInfoResponse,
    RunState,
    ResumeRequest,
    ResumeResponse,
    CancelResponse,
    new_id,
    now_ms,
)
from app.store import STORE
from app.emitter import emit_event
from app.langgraph_poc import build_graph

router = APIRouter()

GRAPH, _CHECKPOINTER = build_graph()

def _require_run(run_id: str) -> RunState:
    if not STORE.has_run(run_id):
        raise HTTPException(status_code=404, detail="run not found")
    return STORE.get_run(run_id)

@router.post("", response_model=RunCreateResponse)
def create_run(req: RunCreateRequest):
    run_id = new_id()
    root_span = new_id()
    run = RunState(
        runId=run_id,
        status="PENDING",
        threadId=run_id,  # Thread ID = Run ID
        rootSpanId=root_span,
    )
    STORE.create_run(run)

    # Start graph execution up to interrupt
    run.status = "RUNNING"
    run.updatedAtMs = now_ms()
    STORE.update_run(run)

    emit_event(run_id, root_span, "LOG", {"msg": "run created"})
    try:
        cfg = {"configurable": {"thread_id": run.threadId}}
        # invoke runs until interrupt point
        # Pass run context through state for event emission
        GRAPH.invoke({"plan": "start", "_run_id": run_id, "_root_span_id": root_span}, config=cfg)

        # At this point, because of interrupt_before=["continue"],
        # we should be paused before continue.
        run.status = "WAITING_APPROVAL"
        run.interrupt = {
            "gate_type": "approval",
            "resume_schema": {"approved": "bool", "notes": "str?"},
        }
        run.updatedAtMs = now_ms()
        STORE.update_run(run)

        emit_event(run_id, root_span, "INTERRUPT_REQUIRED", run.interrupt)
        return RunCreateResponse(runId=run_id, status=run.status)

    except Exception as e:
        run.status = "FAILED"
        run.error = str(e)
        run.updatedAtMs = now_ms()
        STORE.update_run(run)
        emit_event(run_id, root_span, "ERROR", {"error": str(e)})
        return RunCreateResponse(runId=run_id, status=run.status)

@router.get("/{run_id}", response_model=RunInfoResponse)
def get_run(run_id: str):
    run = _require_run(run_id)
    return RunInfoResponse(
        runId=run.runId,
        status=run.status,
        createdAtMs=run.createdAtMs,
        updatedAtMs=run.updatedAtMs,
        interrupt=run.interrupt,
        error=run.error,
    )

@router.get("/{run_id}/events")
def get_events(run_id: str):
    _require_run(run_id)
    events = STORE.list_events(run_id)

    def gen():
        for ev in events:
            line = json.dumps(ev.to_afc_format(), ensure_ascii=False)
            yield line + "\n"

    return StreamingResponse(gen(), media_type="application/x-ndjson")

@router.post("/{run_id}/resume", response_model=ResumeResponse)
def resume_run(run_id: str, req: ResumeRequest):
    run = _require_run(run_id)
    if run.status != "WAITING_APPROVAL":
        raise HTTPException(status_code=409, detail=f"run not waiting approval: {run.status}")

    emit_event(run_id, run.rootSpanId, "RESUMED", {"approved": req.approved, "notes": req.notes})

    try:
        cfg = {"configurable": {"thread_id": run.threadId}}
        # Continue from checkpoint: invoke again and it will resume past interrupt
        # Pass run context through state for event emission
        GRAPH.invoke({"approved": req.approved, "_run_id": run_id, "_root_span_id": run.rootSpanId}, config=cfg)

        run.status = "COMPLETED"
        run.interrupt = None
        run.updatedAtMs = now_ms()
        STORE.update_run(run)

        return ResumeResponse(success=True)
    except Exception as e:
        run.status = "FAILED"
        run.error = str(e)
        run.updatedAtMs = now_ms()
        STORE.update_run(run)
        emit_event(run_id, run.rootSpanId, "ERROR", {"error": str(e)})
        raise

@router.post("/{run_id}/cancel", response_model=CancelResponse)
def cancel_run(run_id: str):
    run = _require_run(run_id)
    if run.status in ("COMPLETED", "FAILED"):
        raise HTTPException(status_code=409, detail=f"cannot cancel terminal run: {run.status}")
    if run.status == "CANCELLED":
        return CancelResponse(success=True)

    run.status = "CANCELLED"
    run.updatedAtMs = now_ms()
    STORE.update_run(run)
    emit_event(run_id, run.rootSpanId, "CANCELLED", {"msg": "cancelled"})
    return CancelResponse(success=True)
