"""
Package validators — Modular 5-Layer Hard-Gate Validation Suite
"""

from .models import DiagnosticViolation, ValidationContext
from .layer1_schema_ast import validate_layer1_schema_and_ast
from .layer2_parity import validate_layer2_parity
from .layer3_anti_slop import validate_layer3_anti_slop
from .layer4_domain_lexicon import validate_layer4_domain_lexicon
from .layer5_handoff_gate import validate_layer5_handoff_gate
from .reporter import print_report

__all__ = [
    "DiagnosticViolation",
    "ValidationContext",
    "validate_layer1_schema_and_ast",
    "validate_layer2_parity",
    "validate_layer3_anti_slop",
    "validate_layer4_domain_lexicon",
    "validate_layer5_handoff_gate",
    "print_report",
]
