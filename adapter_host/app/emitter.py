from __future__ import annotations
from typing import Any, Dict, Optional

from app.models import AdapterEvent
from app.store import STORE
from app.redaction import redact_event_dict

def emit_event(
    run_id: str,
    span_id: str,
    type: str,
    payload: Dict[str, Any],
    parent_span_id: Optional[str] = None,
):
    ev = AdapterEvent(
        run_id=run_id,
        span_id=span_id,
        parent_span_id=parent_span_id,
        type=type,  # validated by Pydantic Literal in model
        payload=payload,
    )
    # Redact before storing/emitting
    redacted = redact_event_dict(ev.to_afc_format())
    # Rehydrate as AdapterEvent for internal store consistency
    ev2 = AdapterEvent(
        ts=redacted["ts"],
        run_id=redacted["run_id"],
        span_id=redacted["span_id"],
        parent_span_id=redacted.get("parent_span_id"),
        type=redacted["type"],
        payload=redacted["payload"],
    )
    STORE.add_event(run_id, ev2)
    return ev2
