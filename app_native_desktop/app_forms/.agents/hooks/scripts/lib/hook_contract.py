"""Contract stdin/stdout cho moi gate script (Antigravity Hooks Standard).

Doc toan bo stdin -> HookPayload (fail-safe, khong bao gio raise) va
emit JSON hop le ra stdout — stdout chi danh rieng cho quyet dinh gate.
"""

from dataclasses import dataclass, field
import json
import sys

# Dam bao UTF-8 tren Windows console/subprocess
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stdin, "reconfigure"):
    try:
        sys.stdin.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


@dataclass
class HookPayload:
    """Payload chuan hoa tu JSON stdin cua hook."""

    raw: dict
    tool_name: str = ""
    args: dict = field(default_factory=dict)
    step_idx: int | None = None
    conversation_id: str = ""
    workspace_paths: list = field(default_factory=list)
    transcript_path: str = ""
    artifact_dir: str = ""
    termination_reason: str = ""
    fully_idle: bool = True
    invocation_num: int | None = None
    error: str = ""


def read_payload() -> HookPayload:
    """Doc toan bo stdin, map sang HookPayload; moi loi -> HookPayload(raw={})."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input or not raw_input.strip():
            return HookPayload(raw={})
        data = json.loads(raw_input)
        if not isinstance(data, dict):
            return HookPayload(raw={})
    except Exception:
        return HookPayload(raw={})

    tool_call = data.get("toolCall")
    tool_name = ""
    args: dict = {}
    if isinstance(tool_call, dict):
        tool_name = str(tool_call.get("name", ""))
        tool_args = tool_call.get("args")
        if isinstance(tool_args, dict):
            args = tool_args

    raw_ws = data.get("workspacePaths")
    workspace_paths = list(raw_ws) if isinstance(raw_ws, list) else []

    return HookPayload(
        raw=data,
        tool_name=tool_name,
        args=args,
        step_idx=data.get("stepIdx"),
        conversation_id=str(data.get("conversationId", "")),
        workspace_paths=workspace_paths,
        transcript_path=str(data.get("transcriptPath", "")),
        artifact_dir=str(data.get("artifactDirectoryPath", "")),
        termination_reason=str(data.get("terminationReason", "")),
        fully_idle=bool(data.get("fullyIdle", True)),
        invocation_num=data.get("invocationNum"),
        error=str(data.get("error", "")),
    )


def emit(decision: str, reason: str = "", **extra) -> None:
    """In DUNG MOT object JSON duy nhat ra stdout: {"decision", "reason", **extra}."""
    payload = {"decision": decision, "reason": reason}
    payload.update(extra)
    print(json.dumps(payload, ensure_ascii=False))


def emit_allow(reason: str = "") -> None:
    """Rut gon emit("allow", reason) — gate khong co vi pham."""
    emit("allow", reason)


def emit_json(obj: dict) -> None:
    """In object JSON tuy y ra stdout (PreInvocation: injectSteps; PostToolUse: {})."""
    print(json.dumps(obj, ensure_ascii=False))
