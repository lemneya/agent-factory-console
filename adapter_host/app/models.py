from __future__ import annotations

from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field
import time
import uuid

EventType = Literal[
    "LOG",
    "STATE_UPDATE",
    "CHECKPOINT_SAVED",
    "INTERRUPT_REQUIRED",
    "RESUMED",
    "COMPLETED",
    "ERROR",
    "CANCELLED",
]

RunStatus = Literal[
    "PENDING",
    "RUNNING",
    "WAITING_APPROVAL",
    "CANCELLED",
    "COMPLETED",
    "FAILED",
]

def now_ms() -> int:
    return int(time.time() * 1000)

def new_id() -> str:
    return str(uuid.uuid4())

class AdapterEvent(BaseModel):
    # AFC-normalized fields
    ts: int = Field(default_factory=now_ms)
    run_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    type: EventType
    payload: Dict[str, Any] = Field(default_factory=dict)

    # dataJson is the exact AFC-compatible envelope (as Manus described)
    def to_afc_format(self) -> Dict[str, Any]:
        return {
            "ts": self.ts,
            "run_id": self.run_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "type": self.type,
            "payload": self.payload,
        }

class RunCreateRequest(BaseModel):
    # keep minimal; this is a PoC
    prompt: Optional[str] = "demo"

class RunCreateResponse(BaseModel):
    runId: str
    status: RunStatus

class RunState(BaseModel):
    runId: str
    status: RunStatus
    createdAtMs: int = Field(default_factory=now_ms)
    updatedAtMs: int = Field(default_factory=now_ms)
    # Thread ID = Run ID (checkpoint isolation)
    threadId: str
    # For PoC span hierarchy: single root span
    rootSpanId: str
    # Holds interrupt metadata when WAITING_APPROVAL
    interrupt: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ResumeRequest(BaseModel):
    approved: bool = True
    notes: Optional[str] = None

class ResumeResponse(BaseModel):
    success: bool = True

class CancelResponse(BaseModel):
    success: bool = True

class RunInfoResponse(BaseModel):
    runId: str
    status: RunStatus
    createdAtMs: int
    updatedAtMs: int
    interrupt: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
