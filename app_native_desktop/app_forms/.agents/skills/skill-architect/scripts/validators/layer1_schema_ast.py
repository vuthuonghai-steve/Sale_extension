"""
layer1_schema_ast.py — Tầng 1: Kiểm tra Cú pháp, Schema và AST.
"""

import re
import sys
from typing import List
from .models import DiagnosticViolation, ValidationContext

try:
    import yaml
except ImportError:
    yaml = None

try:
    import jsonschema
except ImportError:
    jsonschema = None

REQUIRED_HEADINGS = [
    (1, r"^##\s*1[\.\s]\s*Problem\s+Statement", "## 1. Problem Statement"),
    (2, r"^##\s*2[\.\s]\s*Capability\s+Map", "## 2. Capability Map"),
    (3, r"^##\s*3[\.\s]\s*Zone\s+Mapping", "## 3. Zone Mapping"),
    (4, r"^##\s*4[\.\s]\s*Folder\s+Structure", "## 4. Folder Structure"),
    (5, r"^##\s*5[\.\s]\s*Execution\s+Flow", "## 5. Execution Flow"),
    (6, r"^##\s*6[\.\s]\s*Interaction\s+Points", "## 6. Interaction Points"),
    (7, r"^##\s*7[\.\s]\s*Progressive\s+Disclosure", "## 7. Progressive Disclosure"),
    (8, r"^##\s*8[\.\s]\s*Risks", "## 8. Risks"),
    (9, r"^##\s*9[\.\s]\s*Open\s+Questions", "## 9. Open Questions"),
    (10, r"^##\s*10[\.\s]\s*Metadata", "## 10. Metadata"),
]


def validate_layer1_schema_and_ast(ctx: ValidationContext) -> List[DiagnosticViolation]:
    violations: List[DiagnosticViolation] = []

    # 1. Frontmatter Schema Validation
    schema_file = ctx.shared_dir / "schemas" / "design.schema.yaml"
    if not schema_file.is_file():
        schema_file = ctx.assets_dir / "schemas" / "design.schema.yaml"

    if schema_file.is_file() and jsonschema and yaml and ctx.frontmatter:
        try:
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_data = yaml.safe_load(f)
            jsonschema.validate(instance=ctx.frontmatter, schema=schema_data)
        except jsonschema.ValidationError as ve:
            path_str = ".".join(str(p) for p in ve.path)
            violations.append(
                DiagnosticViolation(
                    rule_id="SCHEMA_VALIDATION_ERROR",
                    line_number=1,
                    severity="ERROR",
                    message=f"Frontmatter không khớp schema tại '{path_str}': {ve.message}",
                    fix_hint=f"Cập nhật thuộc tính frontmatter.{path_str} theo đúng quy định trong design.schema.yaml.",
                    asset_reference="schemas/design.schema.yaml",
                    error_code="E101",
                )
            )

    # 2. Check Headings (§1 -> §10)
    found_headings = {}
    for idx, line in enumerate(ctx.lines, start=1):
        for sec_num, pattern, heading_name in REQUIRED_HEADINGS:
            if re.match(pattern, line.strip(), re.IGNORECASE):
                found_headings[sec_num] = (idx, line.strip())

    required_for_stage = {
        "phase1": [1, 10],
        "phase2": [1, 2, 3, 8, 10],
        "phase3": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "final": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    }.get(ctx.stage, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    for sec_num in required_for_stage:
        if sec_num not in found_headings:
            _, _, expected_name = REQUIRED_HEADINGS[sec_num - 1]
            violations.append(
                DiagnosticViolation(
                    rule_id="INV_03_HEADINGS_COMPLETENESS",
                    line_number=ctx.frontmatter_end_line + 1,
                    severity="CRITICAL",
                    message=f"Thiếu Heading bắt buộc: '{expected_name}'",
                    fix_hint=f"Bổ sung section '{expected_name}' vào tài liệu design.md.",
                    asset_reference="assets/assertions/architecture-rules.json",
                    error_code="E102",
                )
            )

    # 3. Check Mermaid Syntax Safety
    mermaid_blocks = re.finditer(r"```mermaid\s*\n(.*?)\n```", ctx.content, re.DOTALL)
    for mb in mermaid_blocks:
        mb_content = mb.group(1)
        mb_start_pos = mb.start()
        mb_line = ctx.content[:mb_start_pos].count("\n") + 1

        unquoted_paren_match = re.search(r'^\s*([a-zA-Z0-9_-]+)\[([^"\n]*\([^\n]*\)[^"\n]*)\]', mb_content, re.MULTILINE)
        if unquoted_paren_match:
            err_line = mb_line + mb_content[:unquoted_paren_match.start()].count("\n")
            violations.append(
                DiagnosticViolation(
                    rule_id="INV_04_MERMAID_SYNTAX_SAFETY",
                    line_number=err_line,
                    severity="ERROR",
                    message=f"Mermaid node chứa dấu ngoặc đơn không được bọc trong nháy kép: `{unquoted_paren_match.group(0)}`",
                    fix_hint='Bọc nhãn node trong dấu nháy kép, ví dụ: id["Nhãn (Chi tiết)"] để tránh crash renderer.',
                    asset_reference="assets/assertions/architecture-rules.json",
                    error_code="E103",
                )
            )

    return violations
