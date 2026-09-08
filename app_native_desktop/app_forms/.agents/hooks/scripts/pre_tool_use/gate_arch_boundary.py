#!/usr/bin/env python3
"""Gate: Architecture Boundaries Check (PreToolUse).

Kiem tra ranh gioi phan tang kien truc 3 lop:
- 1_Backend/ khong duoc import System.Windows.Forms hoac AppForms.Frontend
- 0_Shared/ khong duoc import Backend, Frontend hoac System.Windows.Forms
"""

import os
import re
import sys
import time
from pathlib import Path

# Add scripts root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-ARCH-BOUNDARY"
RULE_ID = "CLEAN-LAYERED-BOUNDARIES"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def _string_values(node: object) -> list[str]:
    values: list[str] = []
    if isinstance(node, str):
        values.append(node)
    elif isinstance(node, dict):
        for value in node.values():
            values.extend(_string_values(value))
    elif isinstance(node, list):
        for item in node:
            values.extend(_string_values(item))
    return values


def collect_contents(args: dict, target_file: str) -> str:
    parts: list[str] = []
    code = args.get("CodeContent")
    if isinstance(code, str):
        parts.append(code)
    replacement = args.get("ReplacementContent")
    if isinstance(replacement, str):
        parts.append(replacement)
    chunks = args.get("ReplacementChunks")
    if isinstance(chunks, list):
        parts.extend(_string_values(chunks))

    if not parts and target_file and os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                parts.append(f.read())
        except Exception as err:
            sys.stderr.write(f"[WARN] Khong the doc file '{target_file}': {err}\n")

    return "\n".join(parts)


def _extract_using_namespaces(content: str) -> list[str]:
    """Trich xuat danh sach namespace tu cac cau lenh using C#.

    Ho tro:
    - using System.Windows.Forms;
    - using static System.Windows.Forms.MessageBox;
    - using WinForms = System.Windows.Forms;
    - using Form = System.Windows.Forms.Form;
    - using global::System.Windows.Forms;
    """
    using_matches = re.findall(r"^\s*using\s+([^;]+);", content, re.MULTILINE)
    results: list[str] = []
    for m in using_matches:
        raw = m.strip()
        # Loai bo 'static '
        if raw.startswith("static "):
            raw = raw[7:].strip()
        # Loai bo alias (e.g., WinForms = System.Windows.Forms)
        if "=" in raw:
            raw = raw.split("=", 1)[1].strip()
        # Loai bo 'global::'
        if raw.startswith("global::"):
            raw = raw[8:].strip()
        if raw:
            results.append(raw)
    return results


def _strip_comments(content: str) -> str:
    """Loai bo comments C# de tranh false-positive khi quet noi dung inline."""
    no_block = re.sub(r"/\*[\s\S]*?\*/", "", content)
    return re.sub(r"//.*$", "", no_block, flags=re.MULTILINE)


def _matches_forbidden(imp: str, forbidden_namespaces: list[str]) -> str | None:
    """Tra ve namespace bi vi pham neu imp khop hoac bat dau bang namespace + '.'"""
    if not isinstance(forbidden_namespaces, (list, tuple, set)):
        return None
    for ns in forbidden_namespaces:
        ns = str(ns).strip()
        if not ns:
            continue
        if imp == ns or imp.startswith(f"{ns}."):
            return ns
    return None


def check(target_file: str, args: dict, rules: dict) -> tuple[str, str]:
    target_lower = target_file.lower().replace("\\", "/")
    if not target_lower.endswith(".cs"):
        return "allow", ""

    arch_cfg = rules.get("architecture_boundaries") if isinstance(rules.get("architecture_boundaries"), dict) else {}
    backend_forbidden = arch_cfg.get("backend_forbidden_namespaces")
    if not isinstance(backend_forbidden, list):
        backend_forbidden = [
            "System.Windows.Forms",
            "AppForms.Frontend",
        ]
    shared_forbidden = arch_cfg.get("shared_forbidden_namespaces")
    if not isinstance(shared_forbidden, list):
        shared_forbidden = [
            "AppForms.Backend",
            "AppForms.Frontend",
            "System.Windows.Forms",
        ]

    content = collect_contents(args, target_file)
    imports = _extract_using_namespaces(content)
    clean_code = _strip_comments(content)

    violations: list[str] = []

    # Kiem tra tang 1_Backend
    if "1_backend" in target_lower:
        for imp in imports:
            matched_ns = _matches_forbidden(imp, backend_forbidden)
            if matched_ns:
                violations.append(f"Backend import '{imp}' (Backend tuyet doi khong duoc phu thuoc [{matched_ns}]).")
        # Kiem tra ca cu phap goi inline (e.g., System.Windows.Forms.MessageBox.Show)
        for ns in backend_forbidden:
            ns_str = str(ns).strip()
            if ns_str and re.search(r"\b" + re.escape(ns_str) + r"\b", clean_code):
                msg = f"Backend su dung truc tiep [{ns_str}] trong ma nguon."
                if not any(ns_str in v for v in violations):
                    violations.append(msg)

    # Kiem tra tang 0_Shared
    if "0_shared" in target_lower:
        for imp in imports:
            matched_ns = _matches_forbidden(imp, shared_forbidden)
            if matched_ns:
                violations.append(f"Shared import '{imp}' (Shared chi chua pure data/types, khong phu thuoc [{matched_ns}]).")
        for ns in shared_forbidden:
            ns_str = str(ns).strip()
            if ns_str and re.search(r"\b" + re.escape(ns_str) + r"\b", clean_code):
                msg = f"Shared su dung truc tiep [{ns_str}] trong ma nguon."
                if not any(ns_str in v for v in violations):
                    violations.append(msg)

    if violations:
        reason = "Vi pham ranh gioi kien truc phan tang: " + "; ".join(violations)
        return "deny", reason

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
