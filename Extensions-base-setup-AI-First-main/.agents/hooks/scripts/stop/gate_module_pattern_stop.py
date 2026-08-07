#!/usr/bin/env python3
"""Gate G0-07 (rule MOD-1): quét src/ kiểm tra pattern vị trí thư mục trước khi dừng.

Nếu phát hiện file .ts/.tsx nằm trực tiếp tại root của src/3_modules/ hoặc
src/2_platform_adapters/ → quyết định "continue" yêu cầu Agent refactor vào đúng thư mục;
sạch → "allow". Fail-open: lỗi không xác định -> "allow".
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.config import repo_root
from lib.hook_contract import HookPayload, emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G0-07"
RULE_ID = "MOD-1"


def _log_decision(
    payload: HookPayload | None, decision: str, reason: str, duration_ms: int
) -> None:
    """Ghi wide event log duy nhất trước khi emit (logging-best-practices)."""
    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir="stop",
        hook_event="Stop",
        decision=decision,
        reason=reason,
        target_file="",
        tool_name="",
        conversation_id=getattr(payload, "conversation_id", "") if payload else "",
        step_idx=getattr(payload, "step_idx", -1) if payload else -1,
        duration_ms=duration_ms,
    )


def scan_module_patterns(root: Path) -> list[str]:
    """Quét src/3_modules và src/2_platform_adapters tìm các file sai vị trí."""
    src_dir = root / "src"
    violations: list[str] = []

    # 1. Quét src/3_modules/
    modules_dir = src_dir / "3_modules"
    if modules_dir.is_dir():
        for item in modules_dir.iterdir():
            if item.is_file() and item.suffix in (".ts", ".tsx"):
                rel = item.relative_to(root)
                violations.append(
                    f"{rel} (Cần chuyển vào src/3_modules/sub-modules/{{name}}/index.ts hoặc composite-modules/{{name}}/index.ts)"
                )

    # 2. Quét src/2_platform_adapters/
    adapters_dir = src_dir / "2_platform_adapters"
    if adapters_dir.is_dir():
        for item in adapters_dir.iterdir():
            if item.is_file() and item.suffix in (".ts", ".tsx"):
                rel = item.relative_to(root)
                violations.append(
                    f"{rel} (Cần chuyển vào src/2_platform_adapters/{{feature}}/{{adapter}}.ts)"
                )

    return violations


def main() -> None:
    """Scan src/ tìm file sai pattern; log wide event; emit JSON quyết định."""
    start = time.perf_counter()
    payload = read_payload()
    root = repo_root()
    violations = scan_module_patterns(root)

    if violations:
        examples = "; ".join(violations[:5])
        decision = "continue"
        reason = (
            f"Phát hiện {len(violations)} file trong src/ sai vị trí pattern thư mục (MOD-1). "
            f"Chi tiết: {examples}. Vui lòng refactor các file này vào đúng thư mục con trước khi hoàn thành task."
        )
    else:
        decision = "allow"
        reason = "Pattern cấu trúc thư mục trong src/ đạt chuẩn (MOD-1)"

    duration_ms = int((time.perf_counter() - start) * 1000)
    _log_decision(payload, decision, reason, duration_ms)
    if decision == "continue":
        emit("continue", reason)
    elif reason:
        emit_allow(reason)
    else:
        emit_allow()


if __name__ == "__main__":
    start = time.perf_counter()
    try:
        main()
    except Exception as exc:
        try:
            payload = read_payload()
        except Exception:
            payload = None
        duration_ms = int((time.perf_counter() - start) * 1000)
        reason = f"Gate {GATE_ID} lỗi — fail-open: {exc}"
        _log_decision(payload, "allow", reason, duration_ms)
        emit_allow(reason)
