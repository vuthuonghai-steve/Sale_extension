#!/usr/bin/env python3
"""Gate: Contract Lock truoc khi sua Interface hoac Schema co ban.

TargetFile thuoc protected_paths (1_Backend/Contracts/Interfaces/, etc.) -> force_ask/ask
de dam bao tinh toan ven cua Contract.
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

GATE_ID = "G-CONTRACT-LOCK"
RULE_ID = "CONTRACT-INTEGRITY"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def check(args: dict, rules: dict) -> tuple[str, str]:
    """TargetFile chua protected_paths -> ask/force_ask; con lai allow."""
    target_file = str(args.get("TargetFile", ""))
    normalized = os.path.normpath(target_file).replace("\\", "/")

    section = rules.get("contract_lock", {})
    protected = section.get("protected_paths", ["1_Backend/Contracts/Interfaces/"])

    if isinstance(protected, list):
        for protected_dir in protected:
            prot_norm = os.path.normpath(str(protected_dir)).replace("\\", "/")
            if prot_norm in normalized:
                reason = (
                    f"File '{target_file}' thuoc tang Contract/Interface duoc bao ve. "
                    f"Moi thay doi Interface yeu cau cap nhat toan bo Services/Tests lien quan."
                )
                return "ask", reason
    return "allow", ""


def main() -> None:
    start = time.perf_counter()
    payload = read_payload()
    rules = load_rules()
    target_file = str(payload.args.get("TargetFile", ""))
    decision, reason = check(payload.args, rules)
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
