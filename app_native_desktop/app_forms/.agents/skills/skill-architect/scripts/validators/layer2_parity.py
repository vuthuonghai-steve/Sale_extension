"""
layer2_parity.py — Tầng 2: Kiểm tra Nhất quán chéo (Cross-Artifact Relational Parity).
"""

import os
import re
from typing import List, Set
from .models import DiagnosticViolation, ValidationContext


def validate_layer2_parity(ctx: ValidationContext) -> List[DiagnosticViolation]:
    violations: List[DiagnosticViolation] = []
    if ctx.stage in ("phase1",):
        return violations

    files_declared: Set[str] = set()

    # 1. Collect files from frontmatter
    if isinstance(ctx.frontmatter, dict) and "zone_mapping" in ctx.frontmatter:
        zm = ctx.frontmatter.get("zone_mapping", {})
        if isinstance(zm, dict):
            for _, zone_info in zm.items():
                if isinstance(zone_info, dict) and "files" in zone_info:
                    for f_obj in zone_info.get("files", []):
                        if isinstance(f_obj, dict) and "path" in f_obj and f_obj["path"]:
                            path_val = f_obj["path"].strip()
                            norm_path = os.path.basename(path_val)
                            if norm_path and not norm_path.startswith("{"):
                                files_declared.add(norm_path)

    # 2. Collect files from §3 Markdown table
    table_rows = re.findall(
        r"\|\s*(?:Core|Knowledge|Scripts|Templates|Data|Loop|Assets)[^\|]*\|\s*`?([^`\|\n]+)`?\s*\|",
        ctx.content,
        re.IGNORECASE,
    )
    for row_file in table_rows:
        raw_files = row_file.strip().split(",")
        for rf in raw_files:
            rf = rf.strip().strip("`")
            if rf and rf.lower() not in ("n/a", "không cần", "none", ""):
                fname = os.path.basename(rf)
                if fname and not fname.startswith("{"):
                    files_declared.add(fname)

    # 3. Collect leaf nodes from Mermaid mindmap in §4
    mindmap_match = re.search(r"```mermaid\s*\nmindmap\s*\n(.*?)\n```", ctx.content, re.DOTALL)
    if mindmap_match:
        mindmap_content = mindmap_match.group(1)
        mindmap_line = ctx.content[:mindmap_match.start()].count("\n") + 1

        mindmap_nodes = set()
        for line in mindmap_content.splitlines():
            clean_node = re.sub(r'[\(\)\[\]"\'`]', '', line.strip())
            if clean_node:
                mindmap_nodes.add(os.path.basename(clean_node))
                mindmap_nodes.add(clean_node)

        # Cross-check
        for declared_file in files_declared:
            found = any(declared_file in node or node in declared_file for node in mindmap_nodes)
            if not found:
                violations.append(
                    DiagnosticViolation(
                        rule_id="INV_01_PARITY_ZONE_MERMAID",
                        line_number=mindmap_line,
                        severity="ERROR",
                        message=f"File '{declared_file}' được khai báo trong §3 Zone Mapping nhưng thiếu trong sơ đồ Mermaid mindmap §4.",
                        fix_hint=f"Bổ sung node `{declared_file}` vào đúng nhánh thư mục tương ứng trong Mermaid mindmap tại §4.",
                        asset_reference="assets/assertions/architecture-rules.json",
                        error_code="E201",
                    )
                )

    return violations
