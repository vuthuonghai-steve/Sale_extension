"""
layer3_anti_slop.py — Tầng 3: Sàng lọc Anti-Slop, Placeholders và Ràng buộc Rủi ro.
"""

import re
from typing import List
from .models import DiagnosticViolation, ValidationContext


def validate_layer3_anti_slop(ctx: ValidationContext) -> List[DiagnosticViolation]:
    violations: List[DiagnosticViolation] = []

    ban_rules = ctx.anti_patterns.get("ban_rules", {})
    placeholders = ban_rules.get("placeholders", [])
    slop_phrases = ban_rules.get("slop_phrases", [])

    if not placeholders:
        placeholders = [
            {
                "regex": r"(?i)\b(todo|tbd|fixme|xxx|placeholder|chưa xác định|tùy chọn|sau này bổ sung)\b",
                "severity": "CRITICAL",
                "message": "Phát hiện placeholder chưa hoàn thiện. Bắt buộc cung cấp thông tin kỹ thuật cụ thể.",
            }
        ]
    if not slop_phrases:
        slop_phrases = [
            {
                "regex": r"(?i)(xử lý một cách phù hợp|các tính năng khác|vân vân|v\.v\.|và các thứ liên quan)",
                "severity": "HIGH",
                "message": "Cụm từ mơ hồ mang tính thoái thác (AI Slop). Phải định nghĩa rõ danh sách cụ thể.",
            }
        ]

    # 1. Line-by-line scanner
    in_code_block = False
    for idx, line in enumerate(ctx.lines, start=1):
        if idx <= ctx.frontmatter_end_line:
            continue

        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue

        if line.strip().startswith("<!--") or line.strip().endswith("-->"):
            continue

        for p in placeholders:
            pattern = p.get("regex", "")
            if pattern and re.search(pattern, line):
                if "không dùng todo" in line.lower() or "cấm todo" in line.lower():
                    continue
                violations.append(
                    DiagnosticViolation(
                        rule_id="ANTI_SLOP_PLACEHOLDER",
                        line_number=idx,
                        severity=p.get("severity", "CRITICAL"),
                        message=f"{p.get('message', 'Phát hiện placeholder vi phạm')}: `{line.strip()}`",
                        fix_hint="Thay thế placeholder bằng nội dung kỹ thuật rõ ràng, dứt khoát hoặc giải pháp cụ thể.",
                        asset_reference="assets/keywords/anti-patterns-ban.yaml",
                        error_code="E301",
                    )
                )

        for s in slop_phrases:
            pattern = s.get("regex", "")
            if pattern and re.search(pattern, line):
                violations.append(
                    DiagnosticViolation(
                        rule_id="ANTI_SLOP_VAGUE_PHRASE",
                        line_number=idx,
                        severity=s.get("severity", "HIGH"),
                        message=f"{s.get('message', 'Phát hiện cụm từ mơ hồ vi phạm')}: `{line.strip()}`",
                        fix_hint="Xác định rõ danh sách hành vi, API hoặc giải pháp cụ thể thay vì dùng từ ngữ mơ hồ.",
                        asset_reference="assets/keywords/anti-patterns-ban.yaml",
                        error_code="E302",
                    )
                )

    # 2. Validate §8 Risks Table
    if ctx.stage in ("phase2", "phase3", "final"):
        risks_heading_match = re.search(
            r"^##\s*8[\.\s]\s*Risks.*?(?=^##\s*9|\Z)", ctx.content, re.MULTILINE | re.DOTALL
        )
        if risks_heading_match:
            risks_section = risks_heading_match.group(0)
            risks_start_line = ctx.content[:risks_heading_match.start()].count("\n") + 1

            table_lines = [
                l
                for l in risks_section.splitlines()
                if l.strip().startswith("|") and not re.match(r"^\|\s*[-:]+\s*\|", l.strip())
            ]
            data_rows = [
                l
                for l in table_lines
                if not any(kw in l.lower() for kw in ["rủi ro", "risk", "mức độ", "severity", "tác động"])
            ]

            if len(data_rows) < 3:
                violations.append(
                    DiagnosticViolation(
                        rule_id="INV_02_RISK_MITIGATION_CONTRACT",
                        line_number=risks_start_line,
                        severity="ERROR",
                        message=f"Bảng §8 Risks chỉ có {len(data_rows)} rủi ro (yêu cầu tối thiểu >= 3 rủi ro cụ thể kèm mitigation).",
                        fix_hint="Bổ sung thêm ít nhất 3 hàng rủi ro với đầy đủ: Tên rủi ro, Tác động, và Biện pháp phòng ngừa (Mitigation).",
                        asset_reference="assets/assertions/architecture-rules.json",
                        error_code="E202",
                    )
                )

    return violations
