#!/usr/bin/env python3
"""G1-09 — Kiểm tra vị trí file và pattern thư mục trong src/ (rule MOD-1).

Kiểm tra TargetFile khi ghi/sửa file trong src/:
- Cấm tạo/sửa file .ts/.tsx trực tiếp tại root src/3_modules/ (bắt buộc trong sub-modules/ hoặc composite-modules/)
- Cấm tạo/sửa file .ts/.tsx trực tiếp tại root src/2_platform_adapters/ (bắt buộc trong thư mục con)
Fail-open: lỗi không xác định -> allow.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.config import load_rules, repo_root
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G1-09"
RULE_ID = "MOD-1"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
REASON_SUFFIX = " — modular-architecture §1"


def check_target_file(target_file_str: str, root: Path) -> tuple[str, str]:
    """Kiểm tra đường dẫn TargetFile xem có vi phạm pattern cấu trúc thư mục không."""
    if not target_file_str:
        return "allow", ""

    target_path = Path(target_file_str).resolve()
    src_dir = (root / "src").resolve()

    # Chỉ kiểm tra nếu file thuộc src/
    try:
        rel_path = target_path.relative_to(src_dir)
    except ValueError:
        return "allow", ""

    parts = rel_path.parts

    # 1. Kiểm tra 3_modules: Cấm file trực tiếp tại src/3_modules/*.ts(x)
    if len(parts) == 2 and parts[0] == "3_modules" and target_path.suffix in (".ts", ".tsx"):
        reason = (
            "BLOCKED: File module không được đặt trực tiếp ở root src/3_modules/. "
            "Phải đặt trong thư mục sub-modules/ hoặc composite-modules/ "
            "(ví dụ: src/3_modules/sub-modules/{name}/index.ts)" + REASON_SUFFIX
        )
        return "deny", reason

    # 2. Kiểm tra 2_platform_adapters: Cấm file trực tiếp tại src/2_platform_adapters/*.ts(x)
    if len(parts) == 2 and parts[0] == "2_platform_adapters" and target_path.suffix in (".ts", ".tsx"):
        reason = (
            "BLOCKED: File platform adapter không được đặt trực tiếp ở root src/2_platform_adapters/. "
            "Phải đặt trong thư mục tính năng chuyên biệt "
            "(ví dụ: src/2_platform_adapters/{feature-name}/{adapter-name}.ts)" + REASON_SUFFIX
        )
        return "deny", reason

    return "allow", ""


def main() -> None:
    """Đọc payload, kiểm tra pattern vị trí file trong src/, ghi log và emit quyết định."""
    start = time.perf_counter()
    payload = read_payload()
    root = repo_root()
    target_file = str(payload.args.get("TargetFile", ""))

    decision, reason = check_target_file(target_file, root)
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
        step_idx=payload.step_idx if isinstance(payload.step_idx, int) else 0,
        duration_ms=duration_ms,
    )

    if decision == "deny":
        emit("deny", reason)
    else:
        emit_allow(reason)


if __name__ == "__main__":
    _start = time.perf_counter()
    try:
        main()
    except Exception as exc:
        duration_ms = int((time.perf_counter() - _start) * 1000)
        reason = f"Gate {GATE_ID} lỗi — fail-open: {exc}"
        try:
            payload = read_payload()
            target_file = str(payload.args.get("TargetFile", ""))
        except Exception:
            target_file = ""
        log_gate_decision(
            gate_id=GATE_ID,
            rule_id=RULE_ID,
            event_dir=EVENT_DIR,
            hook_event=HOOK_EVENT,
            decision="allow",
            reason=reason,
            target_file=target_file,
            duration_ms=duration_ms,
        )
        emit_allow(reason)
