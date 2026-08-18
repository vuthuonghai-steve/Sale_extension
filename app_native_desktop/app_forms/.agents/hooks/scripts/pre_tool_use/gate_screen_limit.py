#!/usr/bin/env python3
"""Gate: Screen & Component Line Limit Check (PreToolUse).

Kiem tra gioi han so dong code:
- Root Screen (*Screen.cs) <= 150 dong.
- Sub-Components (Components/*.cs) <= 300 dong.
- State Hooks (Hooks/*Hook.cs) <= 350 dong.
"""

import os
import sys
import time
from pathlib import Path

# Add scripts root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-SCREEN-LIMIT"
RULE_ID = "CLEAN-LAYERED-UI-LIMITS"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def estimate_line_count(target_file: str, args: dict) -> int | None:
    """Uoc luong tong so dong code cua file sau khi ap dung edit."""
    code_content = args.get("CodeContent")
    if isinstance(code_content, str):
        return len(code_content.splitlines())

    replacement = args.get("ReplacementContent")
    target_content = args.get("TargetContent")
    if isinstance(replacement, str) and target_file and os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if target_content and target_content in content:
                new_content = content.replace(target_content, replacement, 1)
            else:
                new_content = content
            return len(new_content.splitlines())
        except Exception:
            return None

    if target_file and os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                return len(f.readlines())
        except Exception:
            return None

    return None


def check(target_file: str, args: dict, rules: dict) -> tuple[str, str]:
    limits = rules.get("limits", {})
    screen_max = limits.get("screen_max_lines", 150)
    component_max = limits.get("component_max_lines", 300)
    hook_max = limits.get("hook_max_lines", 350)

    norm_path = os.path.normpath(target_file).replace("\\", "/")
    file_name = os.path.basename(norm_path)

    line_count = estimate_line_count(target_file, args)
    if line_count is None:
        return "allow", ""

    if file_name.endswith("Screen.cs"):
        if line_count > screen_max:
            return "deny", (
                f"File Screen '{file_name}' uoc tinh dat {line_count} dong "
                f"(vuot qua gioi han toi da {screen_max} dong theo AGENTS.md). "
                f"Bat buoc phai tach Sub-Components hoac dua logic sang *StateHook.cs."
            )

    if "/components/" in norm_path.lower() and file_name.endswith(".cs"):
        if line_count > component_max:
            return "deny", (
                f"Component '{file_name}' uoc tinh dat {line_count} dong "
                f"(vuot qua gioi han toi da {component_max} dong). "
                f"Can phan ra thanh cac sub-widgets nho hon."
            )

    if "/hooks/" in norm_path.lower() and file_name.endswith(".cs"):
        if line_count > hook_max:
            return "deny", (
                f"State Hook '{file_name}' uoc tinh dat {line_count} dong "
                f"(vuot qua gioi han toi da {hook_max} dong)."
            )

    return "allow", ""


def main() -> None:
    start = time.perf_counter()
    payload = read_payload()
    rules = load_rules()
    target_file = str(payload.args.get("TargetFile", ""))
    decision, reason = check(target_file, payload.args, rules)
    duration_ms = int((time.perf_counter() - start) * 1000)

    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir=EVENT_DIR,
        hook_event=HOOK_EVENT,
        decision=decision,
        reason=reason,
        target_file=target_file,
        tool_name=payload.tool_name,
        conversation_id=payload.conversation_id,
        step_idx=payload.step_idx,
        duration_ms=duration_ms,
    )

    if decision == "allow":
        emit_allow(reason)
    else:
        emit(decision, reason)


if __name__ == "__main__":
    _start = time.perf_counter()
    try:
        main()
    except Exception as exc:
        reason = f"gate internal error — fail-{FAIL_OPEN_DECISION}: {exc}"
        log_gate_decision(
            gate_id=GATE_ID,
            rule_id=RULE_ID,
            event_dir=EVENT_DIR,
            hook_event=HOOK_EVENT,
            decision=FAIL_OPEN_DECISION,
            reason=reason,
            duration_ms=int((time.perf_counter() - _start) * 1000),
        )
        emit_allow(reason)
