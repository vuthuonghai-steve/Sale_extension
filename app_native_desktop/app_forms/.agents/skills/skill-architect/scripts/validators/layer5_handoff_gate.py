"""
layer5_handoff_gate.py — Tầng 5: Khóa chuyển giao Handoff Contract Gate.
"""

from typing import List
from .models import DiagnosticViolation, ValidationContext


def validate_layer5_handoff_gate(
    ctx: ValidationContext, current_violations: List[DiagnosticViolation]
) -> List[DiagnosticViolation]:
    violations: List[DiagnosticViolation] = []
    status = ctx.frontmatter.get("status", "in_progress")
    critical_or_errors = [v for v in current_violations if v.severity in ("CRITICAL", "ERROR")]

    if status == "ready_for_planner" and critical_or_errors:
        violations.append(
            DiagnosticViolation(
                rule_id="INV_05_HANDOFF_GATE_CONTRACT",
                line_number=1,
                severity="CRITICAL",
                message=f"VI PHẠM HANDOFF GATE: Trạng thái 'ready_for_planner' bị từ chối vì còn {len(critical_or_errors)} lỗi vi phạm chưa được xử lý.",
                fix_hint="Giữ nguyên status 'in_progress' hoặc khắc phục 100% các lỗi vi phạm trước khi chuyển giao sang planner.",
                asset_reference="assets/assertions/architecture-rules.json",
                error_code="E501",
            )
        )

    return violations
