#!/usr/bin/env python3
"""Gate: Zero-Placeholder Check truoc khi ghi file (PreToolUse).

Quet CodeContent (write_to_file), ReplacementContent (replace_file_content)
va moi gia tri chuoi trong ReplacementChunks (multi_replace_file_content);
Neu con TODO/NotImplementedException/Console.WriteLine -> deny.
Fail-open khi loi noi bo.
"""

import re
import sys
import time
from pathlib import Path

# Add scripts root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-PLACEHOLDER-PRE"
RULE_ID = "ZERO-PLACEHOLDER"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def _string_values(node: object) -> list[str]:
    """Gom moi gia tri chuoi trong cau truc long nhau (dict/list) cua chunks."""
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


def collect_contents(args: dict) -> list[str]:
    """Gom toan bo noi dung can scan tu args cua cac tool ghi file."""
    contents: list[str] = []
    code = args.get("CodeContent")
    if isinstance(code, str):
        contents.append(code)
    replacement = args.get("ReplacementContent")
    if isinstance(replacement, str):
        contents.append(replacement)
    chunks = args.get("ReplacementChunks")
    if isinstance(chunks, list):
        contents.extend(_string_values(chunks))
    return contents


def check(target_file: str, args: dict, rules: dict) -> tuple[str, str]:
    """Scan placeholder trong noi dung sap ghi; tra ve (decision, reason)."""
    # Chi kiem tra cac file ma nguon (.cs, .xaml, .json, .py, .md neu trong source)
    target_lower = target_file.lower()
    if not (target_lower.endswith(".cs") or target_lower.endswith(".xaml")):
        return "allow", ""

    raw_patterns = rules.get("placeholder", {}).get("patterns", [
        r"//\s*TODO",
        r"//\s*FIXME",
        r"throw\s+new\s+NotImplementedException",
        r"Console\.WriteLine\s*\(",
        r"Debug\.WriteLine\s*\("
    ])

    compiled = []
    for pat in raw_patterns:
        try:
            compiled.append((pat, re.compile(pat, re.IGNORECASE)))
        except Exception:
            continue

    findings: list[tuple[int, str]] = []
    for content in collect_contents(args):
        for line_no, line in enumerate(content.splitlines(), start=1):
            for pat_str, regex in compiled:
                if regex.search(line):
                    pair = (line_no, line.strip())
                    if pair not in findings:
                        findings.append(pair)

    if not findings:
        return "allow", ""

    lines_info = [f"line {ln}: `{code_snip}`" for ln, code_snip in findings[:5]]
    reason = f"Phat hien ma placeholder/stub/console chua hoan thien ({'; '.join(lines_info)}). Quy tac bat buoc: Zero-Placeholder & ILogger."
    return "deny", reason


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
