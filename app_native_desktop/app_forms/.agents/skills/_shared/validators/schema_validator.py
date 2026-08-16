#!/usr/bin/env python3
"""
schema_validator.py — Validate YAML frontmatter from a Markdown file
against a JSON Schema (Draft-07) defined in a YAML file.

CLI:
    python schema_validator.py --schema <schema.yaml> <file.md>

Output: YAML with stage, artifact, timestamp, passed, checks list.
Each check: name, status (pass/fail), error, severity, fix_hint.

Gracefully attempts pip install if pyyaml or jsonschema are missing.
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Dependency management — attempt pip install if missing
# ---------------------------------------------------------------------------

def _ensure_deps():
    """Try to import pyyaml and jsonschema. Offer pip install if missing."""
    missing = []

    try:
        import yaml  # noqa: F401
    except ImportError:
        missing.append("pyyaml")

    try:
        from jsonschema import Draft7Validator, FormatChecker  # noqa: F401
    except ImportError:
        missing.append("jsonschema")

    if not missing:
        return

    print(f"Missing dependencies: {', '.join(missing)}. Attempting pip install...",
          file=sys.stderr)
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", *missing, "-q"],
            timeout=60,
        )
        print("Installation successful.\n", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Could not install dependencies: {e}", file=sys.stderr)
        print(f"Please run: pip install {' '.join(missing)}", file=sys.stderr)
        sys.exit(1)


_ensure_deps()

import yaml
from jsonschema import Draft7Validator, FormatChecker, ValidationError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

import json

def load_data_file(filepath):
    """Load data from a JSON file, YAML file, or extract YAML frontmatter from Markdown.

    Returns (data, error_string). On success error_string is None.
    """
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return None, f"File not found: {filepath}"
    except OSError as e:
        return None, str(e)

    # 1. Parse based on file extension
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == ".json":
        try:
            data = json.loads(content)
            return data, None
        except json.JSONDecodeError as e:
            return None, f"JSON parsing error: {e}"
            
    elif ext in (".yaml", ".yml"):
        try:
            data = yaml.safe_load(content)
            return data, None
        except yaml.YAMLError as e:
            return None, f"YAML parsing error: {e}"

    # 2. Default fallback: Extract frontmatter between --- delimiters from Markdown
    match = re.match(r"^---\s*\n(.*?)\n(?:---|\.\.\.)", content, re.DOTALL)
    if not match:
        return None, "No YAML frontmatter found (must be between --- delimiters or file must have .json/.yaml extension)"

    yaml_text = match.group(1)
    if not yaml_text.strip():
        return None, "Frontmatter is empty"

    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as e:
        return None, f"YAML parsing error: {e}"

    if data is None:
        return None, "Frontmatter is empty (null)"
    if not isinstance(data, dict):
        return None, f"Data is not a mapping (got {type(data).__name__})"

    return data, None


def load_schema(schema_path):
    """Load a JSON Schema from a YAML file."""
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = yaml.safe_load(f)
    except FileNotFoundError:
        return None, f"Schema file not found: {schema_path}"
    except yaml.YAMLError as e:
        return None, f"Schema YAML parse error: {e}"
    except OSError as e:
        return None, str(e)

    if not isinstance(schema, dict):
        return None, "Schema is not a valid YAML mapping"
    return schema, None


def _path_string(path):
    """Format a JSON Schema error path for human reading."""
    parts = []
    for elem in path:
        if isinstance(elem, int):
            parts.append(f"[{elem}]")
        else:
            parts.append(str(elem))
    return " -> ".join(parts) if parts else "root"


def _make_hint(err, path_str):
    """Generate a human-readable fix hint from a ValidationError."""
    schema = err.schema
    if "const" in schema:
        return f"Set this field to the required value '{schema['const']}'"
    if "enum" in schema:
        allowed = "', '".join(schema["enum"])
        return f"Set this field to one of: '{allowed}'"
    if "pattern" in schema:
        return f"Ensure this field matches regex: {schema['pattern']}"
    if "format" in schema:
        return f"Ensure this field is a valid {schema['format']} format"
    if "type" in schema:
        return f"Ensure this field is of type {schema['type']}"
    if "required" in schema:
        missing = ", ".join(schema["required"])
        return f"Add required properties: {missing}"
    if "not" in schema:
        return "This field must NOT match the forbidden pattern"
    if "additionalProperties" in schema:
        return "Remove unexpected properties"
    if "minItems" in schema:
        return f"Array must have at least {schema['minItems']} items"
    if "minimum" in schema or "maximum" in schema:
        lo = schema.get("minimum", "-inf")
        hi = schema.get("maximum", "+inf")
        return f"Value must be between {lo} and {hi}"
    return f"Review schema requirements at '{path_str}'"


def build_check(name, status, error=None, severity=None, fix_hint=None):
    """Create a single check dict with the standard shape."""
    return {
        "name": name,
        "status": status,
        "error": error,
        "severity": severity,
        "fix_hint": fix_hint,
    }


def validate_against_schema(data, schema):
    """Validate *data* against *schema*. Return list of check dicts."""
    validator = Draft7Validator(schema, format_checker=FormatChecker())
    errors = list(validator.iter_errors(data))

    if not errors:
        return [build_check("JSON Schema Compliance", "pass")]

    checks = []
    for err in errors:
        path = _path_string(err.absolute_path)
        hint = _make_hint(err, path)
        severity = "error"
        checks.append(build_check(
            f"Schema: {path}" if path else "Schema: root",
            "fail",
            err.message,
            severity,
            hint,
        ))
    return checks


def make_result(artifact, checks):
    """Wrap checks into the final YAML-serializable result dict."""
    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "schema_validation",
        "artifact": artifact,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Validate YAML frontmatter against a JSON Schema.")
    parser.add_argument("--schema", "-s", required=True,
                        help="Path to schema YAML file")
    parser.add_argument("file", help="Markdown file to validate")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    artifact = os.path.basename(args.file)
    checks = []

    # 1. Parse file content
    data, parse_err = load_data_file(args.file)
    if parse_err:
        checks.append(build_check(
            "Data File Parsing (JSON/YAML/MD)", "fail",
            parse_err, "error",
            "Ensure the file is valid JSON, YAML or Markdown with valid frontmatter between --- delimiters",
        ))
        result = make_result(artifact, checks)
        print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                        sort_keys=False))
        return 1

    checks.append(build_check("Data File Parsing (JSON/YAML/MD)", "pass"))

    # 2. Load schema
    schema, schema_err = load_schema(args.schema)
    if schema_err:
        checks.append(build_check(
            "Schema Loading", "fail",
            schema_err, "error",
            "Verify the schema file is valid YAML and exists",
        ))
        result = make_result(artifact, checks)
        print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                        sort_keys=False))
        return 1

    checks.append(build_check("Schema Loading", "pass"))

    # 3. Validate
    schema_checks = validate_against_schema(data, schema)
    checks.extend(schema_checks)

    result = make_result(artifact, checks)
    print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                    sort_keys=False))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
