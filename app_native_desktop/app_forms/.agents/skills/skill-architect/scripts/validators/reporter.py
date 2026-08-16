"""
reporter.py — Format and output validation results (Console & JSON).
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List
from .models import DiagnosticViolation


def build_validation_result(
    target_file: Path, stage: str, violations: List[DiagnosticViolation]
) -> Dict[str, Any]:
    critical_count = sum(1 for v in violations if v.severity == "CRITICAL")
    error_count = sum(1 for v in violations if v.severity == "ERROR")
    warning_count = sum(1 for v in violations if v.severity == "WARNING")

    score = max(0, 100 - (critical_count * 30) - (error_count * 15) - (warning_count * 5))
    passed = (critical_count == 0 and error_count == 0)

    return {
        "status": "PASS" if passed else "FAIL",
        "exit_code": 0 if passed else 1,
        "score": score,
        "target_file": str(target_file),
        "stage": stage,
        "summary": {
            "critical": critical_count,
            "error": error_count,
            "warning": warning_count,
            "total_violations": len(violations),
        },
        "diagnostics": [v.to_dict() for v in violations],
    }


def print_report(result: Dict[str, Any], json_output: bool = False):
    if json_output:
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    print("=" * 70)
    print(f"🛡️  ARCHITECT DESIGN VALIDATOR — STAGE: {result['stage'].upper()}")
    print(f"📁 Target: {result['target_file']}")
    print(f"📊 Kết quả: {result['status']} | Điểm: {result['score']}/100 | Vi phạm: {result['summary']['total_violations']}")
    print("=" * 70)

    if result["diagnostics"]:
        for d in result["diagnostics"]:
            icon = "🔴" if d["severity"] in ("CRITICAL", "ERROR") else "🟡"
            print(f"{icon} [Line {d['line_number']}] [{d['error_code'] or d['rule_id']}] ({d['severity']}): {d['message']}")
            print(f"   💡 Gợi ý sửa: {d['fix_hint']}")
            if d.get("asset_reference"):
                print(f"   📖 Quy tắc tham chiếu: {d['asset_reference']}")
            print("-" * 70)
    else:
        print("✅ 100% Invariants thỏa mãn! Đạt chuẩn chuyển giao sang Planner.")
