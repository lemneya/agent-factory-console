from __future__ import annotations

from typing import Any, Dict, TypedDict, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.emitter import emit_event

class LGState(TypedDict, total=False):
    plan: str
    approved: bool
    # Pass run context through state for event emission
    _run_id: str
    _root_span_id: str

def build_graph():
    checkpointer = MemorySaver()

    def plan_node(state: LGState) -> LGState:
        run_id = state.get("_run_id", "unknown")
        span_id = state.get("_root_span_id", "unknown")
        emit_event(run_id, span_id, "LOG", {"msg": "plan"})
        state["plan"] = "planned"
        emit_event(run_id, span_id, "STATE_UPDATE", {"state": {"plan": state.get("plan")}})
        emit_event(run_id, span_id, "CHECKPOINT_SAVED", {"at": "plan"})
        return state

    def continue_node(state: LGState) -> LGState:
        run_id = state.get("_run_id", "unknown")
        span_id = state.get("_root_span_id", "unknown")
        emit_event(run_id, span_id, "LOG", {"msg": "continue"})
        emit_event(run_id, span_id, "STATE_UPDATE", {"state": {"plan": state.get("plan"), "approved": state.get("approved")}})
        emit_event(run_id, span_id, "CHECKPOINT_SAVED", {"at": "continue"})
        return state

    def complete_node(state: LGState) -> LGState:
        run_id = state.get("_run_id", "unknown")
        span_id = state.get("_root_span_id", "unknown")
        emit_event(run_id, span_id, "LOG", {"msg": "complete"})
        emit_event(run_id, span_id, "COMPLETED", {"final_state": {"plan": state.get("plan"), "approved": state.get("approved")}})
        return state

    g = StateGraph(LGState)
    g.add_node("plan", plan_node)
    g.add_node("continue", continue_node)
    g.add_node("complete", complete_node)

    g.set_entry_point("plan")
    g.add_edge("plan", "continue")
    g.add_edge("continue", "complete")
    g.add_edge("complete", END)

    # Interrupt before "continue" as per spec
    app = g.compile(
        checkpointer=checkpointer,
        interrupt_before=["continue"],
    )
    return app, checkpointer
