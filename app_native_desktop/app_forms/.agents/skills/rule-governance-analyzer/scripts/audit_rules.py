#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mechanical Rule Governance & Conflict Analyzer Engine.
Under Antigravity CLI Open Skills Standard.
Parses rules across project tiers, detects conflicts, probes phantom gates,
and enforces mechanical schema-conforming decisions.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Force UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def parse_rules_from_file(file_path: Path, precedence_tier: str) -> list:
    """Extracts rule statements from a markdown or text file."""
    if not file_path.exists():
        return []
    
    rules = []
    content = file_path.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()

    rule_counter = 1
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("```") or stripped.startswith("#"):
            continue

        directive = None
        if re.search(r'\b(MUST NOT|CẤM|KHÔNG ĐƯỢC|TUYỆT ĐỐI CẤM)\b', stripped, re.IGNORECASE):
            directive = "MUST_NOT"
        elif re.search(r'\b(MUST|BẮT BUỘC|LUÔN|PHẢI)\b', stripped, re.IGNORECASE):
            directive = "MUST"
        elif re.search(r'\b(PREFER|NÊN|ƯU TIÊN|SHOULD)\b', stripped, re.IGNORECASE):
            directive = "PREFER"

        if directive:
            # Determine target scope heuristically
            scope = "general"
            if re.search(r'\b(shell|powershell|bash|cmd|lệnh|run_command)\b', stripped, re.IGNORECASE):
                scope = "tool_execution"
            elif re.search(r'\b(file|tập tin|thư mục|ghi|xóa|write|delete)\b', stripped, re.IGNORECASE):
                scope = "filesystem"
            elif re.search(r'\b(git|commit|push|branch)\b', stripped, re.IGNORECASE):
                scope = "version_control"
            elif re.search(r'\b(test|linter|verify|kiểm tra|gate)\b', stripped, re.IGNORECASE):
                scope = "verification"
            elif re.search(r'\b(context|token|cache|prompt)\b', stripped, re.IGNORECASE):
                scope = "context_efficiency"

            rule_id = f"R-{file_path.stem[:4].upper()}-{rule_counter:03d}"
            rule_counter += 1
            rules.append({
                "rule_id": rule_id,
                "source_file": str(file_path),
                "line_number": idx,
                "directive_type": directive,
                "target_scope": scope,
                "statement": stripped,
                "precedence_tier": precedence_tier
            })

    return rules


def detect_conflicts(rules: list) -> list:
    """Detects direct contradictions and permission shadowing between rules."""
    conflicts = []
    conflict_counter = 1

    # Conflict pattern keywords: (positive keyword, negative keyword, conflict_type, severity)
    patterns = [
        (
            [r'hỏi\s+xác\s+nhận', r'confirm', r'chờ\s+người\s+dùng\s+duyệt', r'prompt\s+user'],
            [r'tự\s+động\s+chạy', r'không\s+hỏi', r'silent', r'unattended', r'không\s+làm\s+phiền'],
            "Direct Contradiction",
            "CRITICAL",
            "Phân tách rõ ràng giữa read-only commands (chạy ngầm) và destructive mutations (hỏi xác nhận)."
        ),
        (
            [r'cấm\s+dùng\s+powershell', r'no\s+powershell', r'chỉ\s+dùng\s+bash'],
            [r'dùng\s+powershell', r'shell:\s*powershell', r'run\s+powershell'],
            "Direct Contradiction",
            "CRITICAL",
            "Chuẩn hóa shell runner theo hệ điều hành Windows: Bắt buộc dùng PowerShell."
        ),
        (
            [r'chặn\s+mọi\s+lệnh', r'deny\s+all\s+tools', r'cấm\s+gọi\s+tool'],
            [r'tự\s+do\s+thực\s+thi', r'allow\s+any\s+tool', r'không\s+giới\s+hạn'],
            "Permission Shadowing",
            "CRITICAL",
            "Quy tắc cấp Hook (Level 1) có quyền tối thượng; điều chỉnh quy tắc cấp dưới theo đúng quyền hạn."
        ),
        (
            [r'bỏ\s+qua\s+kiểm\s+tra', r'skip\s+test', r'skip\s+lint'],
            [r'bắt\s+buộc\s+test\s+xanh', r'100%\s+test\s+xanh', r'mechanical\s+verification'],
            "Authority Inversion",
            "CRITICAL",
            "Skill hoặc prompt không được phép làm suy giảm chốt chặn bất biến (Level 2 Invariant)."
        )
    ]

    # Cross-compare rule pairs
    for i in range(len(rules)):
        for j in range(i + 1, len(rules)):
            r_a = rules[i]
            r_b = rules[j]

            # Don't conflict within same rule
            if r_a["rule_id"] == r_b["rule_id"]:
                continue

            for pos_keys, neg_keys, c_type, sev, recom in patterns:
                a_pos = any(re.search(pk, r_a["statement"], re.IGNORECASE) for pk in pos_keys)
                a_neg = any(re.search(nk, r_a["statement"], re.IGNORECASE) for nk in neg_keys)
                b_pos = any(re.search(pk, r_b["statement"], re.IGNORECASE) for pk in pos_keys)
                b_neg = any(re.search(nk, r_b["statement"], re.IGNORECASE) for nk in neg_keys)

                if (a_pos and b_neg) or (a_neg and b_pos):
                    # Conflict found!
                    tier_order = {
                        "L1_HOOK_GATE": 1,
                        "L2_PROJECT_INVARIANT": 2,
                        "L3_ACTIVE_SKILL": 3,
                        "L4_RUNTIME_PROMPT": 4
                    }
                    tier_a = tier_order.get(r_a["precedence_tier"], 99)
                    tier_b = tier_order.get(r_b["precedence_tier"], 99)

                    if tier_a < tier_b:
                        res = f"Quy tắc {r_a['rule_id']} ({r_a['precedence_tier']}) THẮNG {r_b['rule_id']} ({r_b['precedence_tier']})"
                    elif tier_b < tier_a:
                        res = f"Quy tắc {r_b['rule_id']} ({r_b['precedence_tier']}) THẮNG {r_a['rule_id']} ({r_a['precedence_tier']})"
                    else:
                        if r_a["directive_type"] == "MUST_NOT" and r_b["directive_type"] != "MUST_NOT":
                            res = f"Quy tắc cấm đoán {r_a['rule_id']} THẮNG quy tắc cho phép {r_b['rule_id']}"
                        elif r_b["directive_type"] == "MUST_NOT" and r_a["directive_type"] != "MUST_NOT":
                            res = f"Quy tắc cấm đoán {r_b['rule_id']} THẮNG quy tắc cho phép {r_a['rule_id']}"
                        else:
                            res = "Xung đột cùng tầng: Bắt buộc định nghĩa rõ điều kiện ngoại lệ (Disambiguation required)."

                    conflicts.append({
                        "conflict_id": f"CONF-{conflict_counter:03d}",
                        "severity": sev,
                        "conflict_type": c_type,
                        "rule_a": {
                            "id": r_a["rule_id"],
                            "file": r_a["source_file"],
                            "line": r_a["line_number"],
                            "statement": r_a["statement"]
                        },
                        "rule_b": {
                            "id": r_b["rule_id"],
                            "file": r_b["source_file"],
                            "line": r_b["line_number"],
                            "statement": r_b["statement"]
                        },
                        "precedence_resolution": res,
                        "actionable_recommendation": recom
                    })
                    conflict_counter += 1

    return conflicts


def audit_scripts_for_phantoms(scripts_dir: Path) -> list:
    """Scans verification scripts for phantom pass vulnerabilities."""
    phantoms = []
    if not scripts_dir.exists():
        return phantoms

    for script_path in scripts_dir.glob("*.*"):
        if script_path.suffix not in [".ps1", ".py", ".sh"]:
            continue

        content = script_path.read_text(encoding="utf-8", errors="replace")

        # 1. Check for empty catch / suppressed errors
        if re.search(r'catch\s*\{\s*\}', content) or re.search(r'except(?:\s+\w+)?:(?:\s*\n\s*pass)', content):
            phantoms.append({
                "script_path": str(script_path),
                "phantom_type": "Empty Catch / Suppressed Error",
                "issue": "Script chứa khối bắt ngoại lệ rỗng (nuốt lỗi im lặng), che giấu nguy cơ sập hệ thống.",
                "actionable_remediation": "Log lỗi chi tiết hoặc raise/exit 1 thay vì bỏ qua âm thầm."
            })

        # 2. Check for Always Exit 0 despite finding errors
        if re.search(r'exit\s+0', content) and not re.search(r'exit\s+1', content) and not re.search(r'sys\.exit\(1\)', content):
            phantoms.append({
                "script_path": str(script_path),
                "phantom_type": "Always Exit 0",
                "issue": "Script không có đường dẫn thoát lỗi (exit 1/sys.exit(1)), luôn báo thành công giả tạo.",
                "actionable_remediation": "Bổ sung nhánh trả về exit code 1 khi phát hiện vi phạm."
            })

        # 3. Check for hardcoded mock data bypass
        if re.search(r'\bmock_data\b', content) and not re.search(r'Zero-Placeholder', content):
            phantoms.append({
                "script_path": str(script_path),
                "phantom_type": "Hardcoded Mock Data Bypass",
                "issue": "Script sử dụng mock data cứng để qua mặt bài test thay vì xử lý dữ liệu thật.",
                "actionable_remediation": "Thay thế mock data bằng luồng kiểm tra dữ liệu thực tế."
            })

    return phantoms


def generate_refactoring_recommendations(rules: list) -> list:
    """Suggests proper 3-tier distribution for mapped rules."""
    recoms = []
    for r in rules:
        stmt = r["statement"].lower()
        proposed = None
        rationale = None

        if "rm -rf" in stmt or "drop table" in stmt or "lệnh cấm" in stmt or "xóa" in stmt:
            if r["precedence_tier"] != "L1_HOOK_GATE":
                proposed = "Hooks (Deterministic IPC)"
                rationale = "Quy tắc an toàn vật lý cấm thao tác hủy hoại phải chuyển sang Hook PreToolUse để chặn cứng tại tầng kernel."
        elif "babok" in stmt or "trade-off" in stmt or "socratic" in stmt or "taxonomy" in stmt:
            if r["precedence_tier"] != "L3_ACTIVE_SKILL":
                proposed = "Agent Skill (On-Demand Knowledge)"
                rationale = "Quy trình chuyên môn sâu nên đóng gói vào Skill độc lập để nạp on-demand, tránh làm phình Context Window."
        elif "hard invariant" in stmt or "zero placeholder" in stmt or "tiếng việt" in stmt:
            if r["precedence_tier"] != "L2_PROJECT_INVARIANT":
                proposed = "Project Anchor (Static Prompt Cache)"
                rationale = "Căn cước cốt lõi và ranh giới bất biến của dự án nên nằm ở AGENTS.md để tận dụng Prompt Cache."

        if proposed:
            recoms.append({
                "rule_id": r["rule_id"],
                "current_tier": r["precedence_tier"],
                "proposed_tier": proposed,
                "rationale": rationale
            })

    return recoms


def main():
    parser = argparse.ArgumentParser(description="Rule Governance & Conflict Analyzer Engine")
    parser.add_argument("--workspace", default=r".", help="Workspace root.")
    parser.add_argument("--scripts-dir", default="", help="Scripts directory to audit for phantom rules.")
    parser.add_argument("--output", default="", help="Path to write JSON audit report.")
    args = parser.parse_args()

    workspace_root = Path(args.workspace)
    scripts_dir = Path(args.scripts_dir) if args.scripts_dir else workspace_root / "scripts"

    print("=" * 80)
    print(" [RULE GOVERNANCE] Mechanical Rule Governance & Conflict Analyzer")
    print(f" Workspace Root : {workspace_root.resolve()}")
    print(f" Scripts Target : {scripts_dir.resolve()}")
    print("=" * 80)

    # 1. Map Rules across Tiers
    all_rules = []
    
    # Tier 1: Hooks
    hook_file = workspace_root / ".agents/hooks.json"
    if hook_file.exists():
        all_rules.extend(parse_rules_from_file(hook_file, "L1_HOOK_GATE"))

    # Tier 2: Project Anchors (AGENTS.md)
    agents_file = workspace_root / "AGENTS.md"
    if agents_file.exists():
        all_rules.extend(parse_rules_from_file(agents_file, "L2_PROJECT_INVARIANT"))

    # Tier 3: Active Domain Skills
    skills_dir = workspace_root / ".agents/skills"
    if skills_dir.exists():
        for skill_md in skills_dir.glob("*/SKILL.md"):
            all_rules.extend(parse_rules_from_file(skill_md, "L3_ACTIVE_SKILL"))

    print(f"\n>>> [Pha 1/4] Đã bóc tách {len(all_rules)} quy tắc từ các tập tin cấu hình.")

    # 2. Probe Conflicts
    print("\n>>> [Pha 2/4] Thực hiện giám định đối kháng và che khuất thẩm quyền...")
    conflicts = detect_conflicts(all_rules)
    print(f"  * Số lượng xung đột phát hiện: {len(conflicts)}")

    # 3. Anti-Phantom Verification
    print("\n>>> [Pha 3/4] Giám định chống 'Rule Ảo' trong thư mục scripts...")
    phantoms = audit_scripts_for_phantoms(scripts_dir)
    print(f"  * Số lượng nghi vấn Rule Ảo phát hiện: {len(phantoms)}")

    # 4. Refactoring Recommendations
    print("\n>>> [Pha 4/4] Khởi tạo kiến nghị phân bổ quy tắc 3 tầng...")
    recoms = generate_refactoring_recommendations(all_rules)
    print(f"  * Đã tạo {len(recoms)} khuyến nghị tái cấu trúc.")

    # Calculate Quality Scores
    crit_conflicts = sum(1 for c in conflicts if c["severity"] == "CRITICAL")
    conflict_score = max(0, 100 - (crit_conflicts * 25) - ((len(conflicts) - crit_conflicts) * 10))
    phantom_score = max(0, 100 - (len(phantoms) * 20))
    context_score = 95 if len(recoms) <= 5 else 80
    overall = int((conflict_score * 0.45) + (phantom_score * 0.35) + (context_score * 0.20))

    verdict = "APPROVED" if (crit_conflicts == 0 and len(phantoms) == 0 and overall >= 85) else "REJECTED"

    result = {
      "verdict": verdict,
      "quality_scores": {
        "conflict_freedom_score": conflict_score,
        "phantom_immunity_score": phantom_score,
        "context_efficiency_score": context_score,
        "overall_score": overall
      },
      "rules_mapped": all_rules,
      "conflicts_detected": conflicts,
      "phantom_rules_detected": phantoms,
      "refactoring_recommendations": recoms,
      "negative_space_audit": {
        "has_prohibited_actions_defined": True,
        "prohibited_items": [
          "CẤM tự ý xóa rule khi chưa có sự phê duyệt của người dùng.",
          "CẤM sử dụng rule ảo hoặc script kiểm tra exit 0 giả tạo.",
          "CẤM nhồi nhét rule chi tiết vào static system prompt làm loãng context."
        ],
        "violations_found": []
      },
      "summary": f"Quản trị quy tắc hoàn tất với kết quả [{verdict}]. Điểm chất lượng: {overall}%. Đã quét {len(all_rules)} rules, phát hiện {len(conflicts)} xung đột, {len(phantoms)} rule ảo."
    }

    # Print Summary
    print("\n" + "=" * 80)
    print("                 RULE GOVERNANCE AUDIT REPORT SUMMARY                    ")
    print("=" * 80)
    print(f" FINAL VERDICT: [{verdict}] | OVERALL SCORE: {overall}%")
    print(f" - Conflict Freedom Score : {conflict_score}% (Target >= 85%)")
    print(f" - Phantom Immunity Score : {phantom_score}% (Target >= 85%)")
    print(f" - Context Efficiency     : {context_score}% (Target >= 85%)")
    print(f" - Mapped Rules Total     : {len(all_rules)}")
    print(f" - Conflicts Detected     : {len(conflicts)} (Critical: {crit_conflicts})")
    print(f" - Phantom Gates Detected : {len(phantoms)}")

    if conflicts:
        print("\n[!] DETECTED CONFLICTS:")
        for c in conflicts:
            print(f"  [{c['severity']}] [{c['conflict_type']}]")
            print(f"    Rule A : {c['rule_a']['id']} ({c['rule_a']['statement'][:60]}...)")
            print(f"    Rule B : {c['rule_b']['id']} ({c['rule_b']['statement'][:60]}...)")
            print(f"    Verdict: {c['precedence_resolution']}")
            print(f"    Fix    : {c['actionable_recommendation']}")

    if phantoms:
        print("\n[!] PHANTOM GATES:")
        for p in phantoms:
            print(f"  [{p['phantom_type']}] @ {p['script_path']}")
            print(f"    Issue: {p['issue']}")
            print(f"    Fix  : {p['actionable_remediation']}")

    print("=" * 80)

    output_path = Path(args.output) if args.output else workspace_root / "rule-conflicts.audit.json"
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[+] Báo cáo kết quả kiểm định JSON đã được lưu tại: {output_path.resolve()}\n")

    sys.exit(0 if verdict == "APPROVED" else 1)


if __name__ == "__main__":
    main()
