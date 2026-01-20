import re
from typing import Any, Dict

_PATTERNS = [
    # OpenAI keys (classic)
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    # GitHub tokens
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9]{20,}"),
    # Bearer tokens
    re.compile(r"Bearer\s+[A-Za-z0-9\-\._~\+/]+=*", re.IGNORECASE),
    # AWS access key (very rough)
    re.compile(r"AKIA[0-9A-Z]{16}"),
    # Generic "api_key=..."
    re.compile(r"(api[_-]?key\s*=\s*)([^\s\"']+)", re.IGNORECASE),
]

REDACTED = "[REDACTED]"

def redact_str(s: str) -> str:
    out = s
    for p in _PATTERNS:
        out = p.sub(REDACTED, out)
    return out

def redact_any(x: Any) -> Any:
    if x is None:
        return None
    if isinstance(x, str):
        return redact_str(x)
    if isinstance(x, list):
        return [redact_any(v) for v in x]
    if isinstance(x, dict):
        return {k: redact_any(v) for k, v in x.items()}
    return x

def redact_event_dict(evt: Dict[str, Any]) -> Dict[str, Any]:
    return redact_any(evt)
