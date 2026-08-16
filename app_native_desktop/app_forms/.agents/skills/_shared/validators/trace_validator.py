#!/usr/bin/env python3
r"""
trace_validator.py — Validate trace tag patterns in a Markdown file.

4 valid patterns (from framework.md §7 Anti-Hallucination Rules):
  1. [TỪ DESIGN §N]       — regex: ^\[TỪ DESIGN §[0-9]+(\.[0-9]+)?\]$
  2. [GỢI Ý BỔ SUNG]
  3. [CẦN LÀM RÕ]
  4. [TỪ AUDIT TÀI NGUYÊN]

Catches common typos:
  [CẦN LÀM RÕ]        → should be [CẦN LÀM RÕ]
  [TỪ AUDIT TÀI NGUYÊN] (missing N on NGUYÊN) → should be [TỪ AUDIT TÀI NGUYÊN]

CLI:
    python trace_validator.py <file.md>

Output: PASS or FAIL with list of invalid tags.
Uses YAML output in the same schema_validator result shape.
"""

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Dependency management
# ---------------------------------------------------------------------------

def _ensure_deps():
    try:
        import yaml  # noqa: F401
    except ImportError:
        print("Missing pyyaml. Attempting pip install...", file=sys.stderr)
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "pyyaml", "-q"],
                timeout=60,
            )
            print("Installation successful.\n", file=sys.stderr)
        except Exception as e:
            print(f"ERROR: Could not install pyyaml: {e}", file=sys.stderr)
            print("Please run: pip install pyyaml", file=sys.stderr)
            sys.exit(1)


_ensure_deps()
import yaml


# ---------------------------------------------------------------------------
# Patterns (from spec and framework.md)
# ---------------------------------------------------------------------------

VALID_PATTERNS = [
    re.compile(r"^\[TỪ DESIGN §[0-9]+(\.[0-9]+)?\]$"),
    re.compile(r"^\[GỢI Ý BỔ SUNG\]$"),
    re.compile(r"^\[CẦN LÀM RÕ\]$"),
    re.compile(r"^\[TỪ AUDIT TÀI NGUYÊN\]$"),
]

# Known typo variants for helpful error messages
KNOWN_TYPOS = {
    "[CẦU LÀM RÕ]": "'CẦU' should be 'CẦN'",
    "[TỪ AUDIT TÀI NGUYÊN]": "Missing 'N' in NGUYÊN (should be NGUYÊN)",
    "[GỢI BỔ SUNG]": "Missing 'Ý' after 'GỢI'",
    "[GỢI Ý BỔ XUNG]": "'XUNG' should be 'SUNG'",
    "[TỪ DESIGN §]": "Missing section number after '§'",
    "[TỪ DESION §": "'DESION' should be 'DESIGN'",
    "[TỪ ĐESIGN §": "'ĐESIGN' should be 'DESIGN'",
}

# Heuristic to detect bracket content that looks like a trace tag
TRACE_KEYWORDS = ["TỪ ", "GỢI", "CẦN", "CẦU", "DESIGN", "AUDIT", "TÀI NGUYÊN", "DESION", "ĐESIGN", "BỔ SUNG"]

ANY_BRACKET = re.compile(r"\[([^\]]*)\]")


def is_trace_like(tag_text):
    """Check if bracketed text resembles a trace tag (heuristic)."""
    upper = tag_text.upper()
    return any(kw.upper() in upper for kw in TRACE_KEYWORDS)


def is_valid(full_tag):
    """Check if a tag matches any of the 4 valid patterns."""
    return any(p.match(full_tag) for p in VALID_PATTERNS)


def find_typo_hint(full_tag):
    """Return a hint string if the tag matches a known typo, else None."""
    for typo, hint in KNOWN_TYPOS.items():
        if typo in full_tag:
            return f"Possible typo: {hint}"
    return None


def validate_file(filepath):
    """Scan a file for trace tags and validate them.

    Returns a result dict matching schema_validator style.
    """
    content = Path(filepath).read_text(encoding="utf-8")

    invalid_tags = []
    typo_hints = []

    for match in ANY_BRACKET.finditer(content):
        tag_text = match.group(1)
        full_tag = match.group(0)

        if not is_trace_like(tag_text):
            continue

        if not is_valid(full_tag):
            invalid_tags.append(full_tag)
            hint = find_typo_hint(full_tag)
            if hint:
                typo_hints.append({"tag": full_tag, "hint": hint})

    passed = len(invalid_tags) == 0
    checks = [
        {
            "name": "trace_tags_validation",
            "status": "pass" if passed else "fail",
            "total_invalid": len(invalid_tags),
            "invalid_tags": invalid_tags,
            "typo_hints": typo_hints,
            "error": None if passed else f"Found {len(invalid_tags)} invalid trace tag(s)",
        }
    ]

    return {
        "stage": "trace_validation",
        "artifact": Path(filepath).name,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "passed": passed,
        "checks": checks,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Validate trace tag patterns in a Markdown file.")
    parser.add_argument("file", help="Markdown file to validate")
    args = parser.parse_args(argv)

    filepath = Path(args.file)
    if not filepath.exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        return 1

    result = validate_file(str(filepath))
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                    sort_keys=False))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
