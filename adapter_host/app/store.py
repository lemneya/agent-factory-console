from __future__ import annotations
from typing import Dict, List
from threading import Lock

from app.models import RunState, AdapterEvent

class MemoryStore:
    def __init__(self):
        self._lock = Lock()
        self.runs: Dict[str, RunState] = {}
        self.events: Dict[str, List[AdapterEvent]] = {}

    def create_run(self, run: RunState):
        with self._lock:
            self.runs[run.runId] = run
            self.events[run.runId] = []

    def get_run(self, run_id: str) -> RunState:
        with self._lock:
            return self.runs[run_id]

    def has_run(self, run_id: str) -> bool:
        with self._lock:
            return run_id in self.runs

    def update_run(self, run: RunState):
        with self._lock:
            self.runs[run.runId] = run

    def add_event(self, run_id: str, ev: AdapterEvent):
        with self._lock:
            self.events.setdefault(run_id, []).append(ev)

    def list_events(self, run_id: str) -> List[AdapterEvent]:
        with self._lock:
            return list(self.events.get(run_id, []))

STORE = MemoryStore()
