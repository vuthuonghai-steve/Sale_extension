#!/usr/bin/env python3
"""
validate_architect_design.py — Orchestrator & CLI Runner for 5-Layer Hard-Gate Validation.
Áp dụng nguyên tắc Single Responsibility & Minimal Functions.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import List, Optional, Tuple

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Import modular validators
from validators.models import DiagnosticViolation, ValidationContext
from validators.layer1_schema_ast import validate_layer1_schema_and_ast
from validators.layer2_parity import validate_layer2_parity
from validators.layer3_anti_slop import validate_layer3_anti_slop
from validators.layer4_domain_lexicon import validate_layer4_domain_lexicon
from validators.layer5_handoff_gate import validate_layer5_handoff_gate
from validators.reporter import build_validation_result, print_report

try:
    import yaml
except ImportError:
    yaml = None


def load_validation_context(target_file: Path, stage: str, assets_dir: Optional[Path]) -> Tuple[Optional[ValidationContext], List[DiagnosticViolation]]:
    violations: List[DiagnosticViolation] = []
    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parent
    assets_path = assets_dir or (skill_dir / "assets")
    shared_path = skill_dir.parent / "_shared"

    if not target_file.is_file():
        violations.append(
            DiagnosticViolation(
                rule_id="FILE_NOT_FOUND",
                line_number=1,
                severity="CRITICAL",
                message=f"Tập tin thiết kế không tồn tại: {target_file}",
                fix_hint="Hãy kiểm tra đường dẫn hoặc chạy init_context.py.",
                error_code="E001",
            )
        )
        return None, violations

    try:
        content = target_file.read_text(encoding="utf-8")
        lines = content.splitlines()
    except Exception as e:
        violations.append(
            DiagnosticViolation(
                rule_id="FILE_READ_ERROR",
                line_number=1,
                severity="CRITICAL",
                message=f"Lỗi khi đọc file {target_file}: {e}",
                fix_hint="Kiểm tra quyền truy cập file.",
                error_code="E002",
            )
        )
        return None, violations

    fm_match = re.match(r"^---\s*\n(.*?)\n(?:---|\.\.\.)", content, re.DOTALL)
    if not fm_match:
        violations.append(
            DiagnosticViolation(
                rule_id="FRONTMATTER_MISSING",
                line_number=1,
                severity="CRITICAL",
                message="Không tìm thấy khối YAML Frontmatter.",
                fix_hint="Bổ sung YAML frontmatter ở đầu file design.md.",
                error_code="E101",
            )
        )
        return None, violations

    fm_raw = fm_match.group(1)
    fm_data = yaml.safe_load(fm_raw) if yaml else {}

    ctx = ValidationContext(
        target_file=target_file,
        stage=stage.lower(),
        assets_dir=assets_path,
        shared_dir=shared_path,
        content=content,
        lines=lines,
        frontmatter=fm_data or {},
        frontmatter_raw=fm_raw,
        frontmatter_end_line=fm_raw.count("\n") + 2,
    )

    # Load assets
    lexicon_file = assets_path / "keywords" / "domain-lexicon.yaml"
    if lexicon_file.is_file() and yaml:
        ctx.domain_lexicons = yaml.safe_load(lexicon_file.read_text(encoding="utf-8")) or {}

    ban_file = assets_path / "keywords" / "anti-patterns-ban.yaml"
    if ban_file.is_file() and yaml:
        ctx.anti_patterns = yaml.safe_load(ban_file.read_text(encoding="utf-8")) or {}

    rules_file = assets_path / "assertions" / "architecture-rules.json"
    if rules_file.is_file():
        ctx.architecture_rules = json.loads(rules_file.read_text(encoding="utf-8")) or {}

    return ctx, violations


def run_pipeline(target_file: Path, stage: str, assets_dir: Optional[Path]) -> dict:
    ctx, init_violations = load_validation_context(target_file, stage, assets_dir)
    if not ctx:
        return build_validation_result(target_file, stage, init_violations)

    violations: List[DiagnosticViolation] = []
    # Pipe and Filter Pattern:
    violations.extend(validate_layer1_schema_and_ast(ctx))
    violations.extend(validate_layer2_parity(ctx))
    violations.extend(validate_layer3_anti_slop(ctx))
    violations.extend(validate_layer4_domain_lexicon(ctx))
    violations.extend(validate_layer5_handoff_gate(ctx, violations))

    return build_validation_result(target_file, stage, violations)


def main():
    parser = argparse.ArgumentParser(description="Deterministic 5-Layer Hard-Gate Validator")
    parser.add_argument("--file", "-f", type=str, help="Đường dẫn đến file design.md")
    parser.add_argument("--stage", "-s", type=str, default="final", choices=["phase1", "phase2", "phase3", "final"])
    parser.add_argument("--json-output", "-j", action="store_true", help="Xuất JSON format")
    parser.add_argument("--assets-dir", type=str, help="Đường dẫn thư mục assets/")

    args = parser.parse_args()
    target_path = Path(args.file).resolve() if args.file else (list(Path.cwd().glob(".skill-context/*/design.md")) or [Path.cwd() / "design.md"])[0].resolve()
    assets_path = Path(args.assets_dir).resolve() if args.assets_dir else None

    result = run_pipeline(target_path, args.stage, assets_path)
    print_report(result, json_output=args.json_output)
    sys.exit(result["exit_code"])


if __name__ == "__main__":
    main()
