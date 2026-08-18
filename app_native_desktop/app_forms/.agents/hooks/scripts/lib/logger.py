"""Wide-event logger cho moi quyet dinh gate (logging-best-practices).

Mot gate emit DUNG MOT canonical log line JSONL moi lan quyet dinh;
khong in gi ra stdout, khong bao gio raise khi ghi log that bai.
"""

import datetime
import json
import os
from pathlib import Path

_LOG_DIR_REL = ".agents/hooks/logs"
_LEVEL_ERROR_DECISIONS = {"deny", "force_ask", "continue"}


def log_gate_decision(
    *,
    gate_id: str,
    rule_id: str,
    event_dir: str,
    hook_event: str,
    decision: str,
    reason: str = "",
    target_file: str = "",
    tool_name: str = "",
    conversation_id: str = "",
    step_idx: int | None = None,
    duration_ms: int | None = None,
) -> None:
    """Ghi 1 dong JSON (append-only) vao logs/gates-YYYY-MM-DD.jsonl."""
    try:
        from config.config import repo_root
        root = repo_root()
    except Exception:
        current = Path(__file__).resolve().parent
        root = current
        for parent in (current, *current.parents):
            if (parent / "AppForms.csproj").exists():
                root = parent
                break
            if (parent / ".agents").is_dir() and parent.name != ".agents":
                root = parent
                break
        if root == current:
            root = Path.cwd()

    try:
        logs_dir = root / _LOG_DIR_REL
        logs_dir.mkdir(parents=True, exist_ok=True)

        now = datetime.datetime.now(datetime.timezone.utc)
        log_path = logs_dir / f"gates-{now.strftime('%Y-%m-%d')}.jsonl"

        record = {
            "event": "hook_gate_decision",
            "gate_id": gate_id,
            "rule_id": rule_id,
            "event_dir": event_dir,
            "hook_event": hook_event,
            "tool_name": tool_name,
            "target_file": target_file,
            "decision": decision,
            "reason": reason,
            "conversation_id": conversation_id,
            "step_idx": step_idx,
            "duration_ms": duration_ms,
            "timestamp": now.isoformat(),
            "commit_hash": os.environ.get("GIT_COMMIT", "unknown"),
            "level": "error" if decision in _LEVEL_ERROR_DECISIONS else "info",
        }
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        return
