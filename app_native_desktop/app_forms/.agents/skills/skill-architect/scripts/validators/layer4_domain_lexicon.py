"""
layer4_domain_lexicon.py — Tầng 4: Kiểm định Thuật ngữ Chuyên ngành (Domain Lexicon Density).
"""

from typing import List
from .models import DiagnosticViolation, ValidationContext


def validate_layer4_domain_lexicon(ctx: ValidationContext) -> List[DiagnosticViolation]:
    violations: List[DiagnosticViolation] = []
    if not ctx.domain_lexicons or ctx.stage in ("phase1",):
        return violations

    lexicons = ctx.domain_lexicons.get("domain_lexicons", {})
    is_desktop_domain = any(term in ctx.content for term in ["Windows", "C#", "Desktop", "WinForms", "Form", "Native"])

    if is_desktop_domain:
        csharp_lex = lexicons.get("windows_native_csharp", {})
        mandatory_terms = csharp_lex.get("mandatory_terms_any", ["InvokeOnUI", "STA Thread", "FormStateObserver", "try...finally"])
        found_terms = [t for t in mandatory_terms if t in ctx.content]

        if len(found_terms) < 2:
            violations.append(
                DiagnosticViolation(
                    rule_id="DOMAIN_LEXICON_INSUFFICIENT",
                    line_number=1,
                    severity="WARNING",
                    message=f"Mật độ thuật ngữ Domain Desktop C# còn thấp. Chỉ tìm thấy: {found_terms}. Cần các thuật ngữ: {mandatory_terms}.",
                    fix_hint="Cụ thể hóa giải pháp kỹ thuật bằng các thuật ngữ luồng chuẩn: STA Thread, InvokeOnUI, FormStateObserver, try...finally.",
                    asset_reference="assets/keywords/domain-lexicon.yaml",
                    error_code="E401",
                )
            )

    return violations
