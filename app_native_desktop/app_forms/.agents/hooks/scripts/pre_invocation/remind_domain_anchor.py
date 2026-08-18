#!/usr/bin/env python3
"""Gate: Reminder Domain Anchor (PreInvocation).

Moi phien lam viec, chèn ephemeralMessage nhac nho Agent ve kien truc AppForms
(Clean 3-layer, Screen <= 150 dong, InvokeOnUI, Zero-placeholder).
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules, repo_root
from lib.hook_contract import HookPayload, emit_json, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-REMINDER-DOMAIN"
RULE_ID = "DOMAIN-ANCHOR-REMIND"
EVENT_DIR = "pre_invocation"
HOOK_EVENT = "PreInvocation"

_START: float = time.perf_counter()
_EMITTED: bool = False


def _duration_ms() -> int:
    return round((time.perf_counter() - _START) * 1000)


def _emit(obj: dict) -> None:
    global _EMITTED
    emit_json(obj)
    _EMITTED = True


def _log_decision(payload: HookPayload, *, decision: str, reason: str, target_file: str = "") -> None:
    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir=EVENT_DIR,
        hook_event=HOOK_EVENT,
        decision=decision,
        reason=reason,
        target_file=target_file,
        tool_name=payload.tool_name or "",
        conversation_id=payload.conversation_id or "",
        step_idx=payload.step_idx if isinstance(payload.step_idx, int) else 0,
        duration_ms=_duration_ms(),
    )


def main() -> None:
    payload = read_payload()
    root = repo_root()

    agents_md = root / ".agents" / "AGENTS.md"
    if not agents_md.exists():
        agents_md = root / "AGENTS.md"

    message = (
        "💡 [AppForms Charter Anchor]: "
        "1. Kien truc: 0_Shared (pure data), 1_Backend (core logic, cam UI controls), 2_Frontend (Screens, Components, Hooks). "
        "2. UI Size: Root Screen <= 150 dong, Sub-Components <= 300 dong, StateHooks <= 350 dong. "
        "3. Thread-safety: Moi cap nhat UI bat buoc boc FormStateObserver.InvokeOnUI. "
        "4. Chat luong: Zero-Placeholder (cam TODO/NotImplementedException/Console.WriteLine), dotnet build 100% Pass."
    )

    _emit({"injectSteps": [{"ephemeralMessage": message}]})
    _log_decision(
        payload,
        decision="inject",
        reason="domain anchor reminder injected",
        target_file=str(agents_md) if agents_md.exists() else "",
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        if not _EMITTED:
            emit_json({})
        log_gate_decision(
            gate_id=GATE_ID,
            rule_id=RULE_ID,
            event_dir=EVENT_DIR,
            hook_event=HOOK_EVENT,
            decision="allow",
            reason=f"gate error (fail-open): {exc}",
            target_file="",
            tool_name="",
            conversation_id="",
            step_idx=0,
            duration_ms=_duration_ms(),
        )
