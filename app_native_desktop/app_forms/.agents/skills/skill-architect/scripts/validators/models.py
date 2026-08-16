"""
models.py — Data models and validation context for skill-architect validators.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


@dataclass
class DiagnosticViolation:
    rule_id: str
    line_number: int
    severity: str  # CRITICAL, ERROR, WARNING, INFO
    message: str
    fix_hint: str
    asset_reference: str = ""
    error_code: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "error_code": self.error_code,
            "line_number": self.line_number,
            "severity": self.severity.upper(),
            "message": self.message,
            "fix_hint": self.fix_hint,
            "asset_reference": self.asset_reference,
        }


@dataclass
class ValidationContext:
    target_file: Path
    stage: str
    assets_dir: Path
    shared_dir: Path
    content: str = ""
    lines: List[str] = field(default_factory=list)
    frontmatter: Dict[str, Any] = field(default_factory=dict)
    frontmatter_raw: str = ""
    frontmatter_end_line: int = 0
    domain_lexicons: Dict[str, Any] = field(default_factory=dict)
    anti_patterns: Dict[str, Any] = field(default_factory=dict)
    architecture_rules: Dict[str, Any] = field(default_factory=dict)
