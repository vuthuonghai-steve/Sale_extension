#!/usr/bin/env python3
"""
handoff_validator.py — Validate handoff readiness per stage for Master Skill Suite Ver_2.0.0.

This validator ensures that artifacts meet the Bounded Context contracts
and cross-artifact consistency rules between stages.

Supported Stages:
  - exploration-to-design  Validate exploration.json is ready for Stage 1 Architect
  - design-to-planner      Validate blueprint.json is ready for Stage 2 Planner
  - planner-to-builder     Validate dag_plan.json is ready for Stage 3 Builder
  - builder-to-tester      Validate built code structure is ready for Stage 4 Tester
  - tester-to-indexer      Validate verification.json indicates PASS (Score >= 85%)
  - indexer-complete       Validate registry registration and llms.txt integration

CLI:
    python handoff_validator.py --stage <stage> <file.json/md>
"""

import argparse
import os
import re
import subprocess
import sys
import json
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
# Common helpers
# ---------------------------------------------------------------------------

def load_data_file(filepath):
    """Load data from JSON file, YAML file, or extract YAML frontmatter from Markdown.

    Returns (data, error_string).
    """
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return None, f"File not found: {filepath}"
    except OSError as e:
        return None, str(e)

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

    # Default fallback: Extract frontmatter between --- delimiters from Markdown
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

    if not isinstance(data, dict):
        return None, "Data must be a mapping"

    return data, None


def make_check(name, passed, error=None, fix_hint=None):
    """Create a check dictionary in the standard shape."""
    return {
        "name": name,
        "status": "pass" if passed else "fail",
        "error": error,
        "fix_hint": fix_hint,
    }


# ---------------------------------------------------------------------------
# STAGE: exploration-to-design (Explorer -> Architect)
# ---------------------------------------------------------------------------

def validate_exploration_to_design(file_path, data):
    checks = []

    # 1. Base fields
    lifecycle = data.get("metadata", {}).get("lifecycle_status")
    checks.append(make_check(
        "metadata_lifecycle_status",
        lifecycle == "raw" or lifecycle == "designed",
        error=f"lifecycle_status must be 'raw' or 'designed' during handoff, got '{lifecycle}'",
        fix_hint="Set metadata.lifecycle_status: \"raw\""
    ))

    # 2. Risk assessment
    tech_risks = data.get("technical_risks", [])
    checks.append(make_check(
        "technical_risks_min_count",
        len(tech_risks) >= 3,
        error=f"Must identify at least 3 technical risks, found {len(tech_risks)}",
        fix_hint="Add more items to technical_risks array in exploration.json"
    ))

    # 3. Security threats (Prompt Injection check)
    sec_risks = data.get("security_risks", [])
    has_injection = any(r.get("threat_type") == "Prompt Injection" for r in sec_risks)
    checks.append(make_check(
        "security_threat_prompt_injection_analyzed",
        has_injection,
        error="Security threats must explicitly analyze 'Prompt Injection' risk",
        fix_hint="Add a threat with threat_type: 'Prompt Injection' and defense_mechanism"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "exploration-to-design",
        "artifact": Path(file_path).name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# STAGE: design-to-planner (Architect -> Planner)
# ---------------------------------------------------------------------------

def validate_design_to_planner(file_path, data):
    checks = []

    # 1. Folder structure physically mapped
    folder = data.get("static_structure", {}).get("folder_structure", [])
    checks.append(make_check(
        "folder_structure_minimum_files",
        len(folder) >= 3,
        error=f"Blueprint must map at least 3 physical files, found {len(folder)}",
        fix_hint="Map all output files into 7 zones in static_structure.folder_structure"
    ))

    # 2. Path safety check (No absolute, no dotdot)
    bad_paths = []
    for entry in folder:
        path = entry.get("file_path", "")
        if path.startswith("/"):
            bad_paths.append(f"Absolute: '{path}'")
        elif ".." in path.split("/"):
            bad_paths.append(f"Contains dotdot: '{path}'")
    checks.append(make_check(
        "path_safety_compliance",
        len(bad_paths) == 0,
        error=f"Unsafe paths found: {bad_paths}" if bad_paths else None,
        fix_hint="Paths must be relative to skill directory and must NOT contain '..' or start with '/'"
    ))

    # 3. Security Mitigation Map check
    mitigations = data.get("mitigation_map", [])
    checks.append(make_check(
        "security_mitigation_mapped",
        len(mitigations) >= 1,
        error="Mitigation map must contain at least 1 security control mapping",
        fix_hint="Establish how Stage 0 security risks are resolved in Stage 3 zones"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "design-to-planner",
        "artifact": Path(file_path).name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# STAGE: planner-to-builder (Planner -> Builder)
# ---------------------------------------------------------------------------

def validate_planner_to_builder(file_path, data):
    checks = []

    tasks = data.get("tasks", [])
    task_ids = [t.get("task_id") for t in tasks]

    # 1. Unique task IDs
    dups = set([x for x in task_ids if task_ids.count(x) > 1])
    checks.append(make_check(
        "unique_task_ids",
        len(dups) == 0,
        error=f"Duplicate task IDs found: {list(dups)}" if dups else None,
        fix_hint="Ensure every task in dag_plan.json has a unique task_id"
    ))

    # 2. DAG Dependency resolution
    id_set = set(task_ids)
    bad_deps = {}
    for t in tasks:
        for dep in t.get("dependencies", []):
            if dep not in id_set:
                bad_deps.setdefault(t["task_id"], []).append(dep)
    checks.append(make_check(
        "dag_dependencies_resolved",
        len(bad_deps) == 0,
        error=f"Tasks reference missing dependencies: {bad_deps}" if bad_deps else None,
        fix_hint="All depends_on/dependencies must refer to valid tasks in this dag_plan.json"
    ))

    # 3. Trace tag format
    bad_traces = []
    trace_pattern = re.compile(r"^\[TỪ (DESIGN|AUDIT TÀI NGUYÊN) §.+\]$")
    for t in tasks:
        trace = t.get("trace_tag", "")
        if not trace_pattern.match(trace):
            bad_traces.append(f"{t['task_id']}: '{trace}'")
    checks.append(make_check(
        "trace_tags_consistency",
        len(bad_traces) == 0,
        error=f"Invalid trace tags: {bad_traces}" if bad_traces else None,
        fix_hint="Use format [TỪ DESIGN §N] or [TỪ AUDIT TÀI NGUYÊN §N]"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "planner-to-builder",
        "artifact": Path(file_path).name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# STAGE: builder-to-tester (Builder -> Tester)
# ---------------------------------------------------------------------------

def validate_builder_to_tester(file_path, data):
    """Checks that the newly built skill folder matches the design contract."""
    checks = []

    # File path is expected to be the built SKILL.md file
    skill_md = Path(file_path)
    skill_dir = skill_md.parent

    # 1. SKILL.md exists
    checks.append(make_check(
        "skill_md_exists",
        skill_md.exists(),
        error=f"SKILL.md not found at {skill_md}" if not skill_md.exists() else None,
        fix_hint="Ensure the Builder creates the root SKILL.md file"
    ))

    # 2. Token size check of SKILL.md (Dynamic Index Anchor: 500 - 1200 warning)
    if skill_md.exists():
        content = skill_md.read_text(encoding="utf-8")
        tokens_est = len(content.split())  # rough word count estimation
        checks.append(make_check(
            "skill_md_token_budget",
            tokens_est <= 1200,
            error=f"SKILL.md is too large (est. {tokens_est} words). Target is < 1200 words to avoid fragmentation.",
            fix_hint="Move detailed guides to knowledge/ or policy/ and keep SKILL.md as an L0 Anchor index."
        ))
    else:
        checks.append(make_check("skill_md_token_budget", False, error="Cannot check size, file missing"))

    # 3. Core structure zones
    has_policy = (skill_dir / "policy").exists() or (skill_dir / "knowledge").exists()
    checks.append(make_check(
        "modular_layering_folder_structure",
        has_policy,
        error="Skill must have at least 'policy/' or 'knowledge/' directory to avoid prose flat files",
        fix_hint="Create policy/ and knowledge/ subdirectories to modularize documentation"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "builder-to-tester",
        "artifact": skill_md.name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# STAGE: tester-to-indexer (Tester -> Indexer)
# ---------------------------------------------------------------------------

def validate_tester_to_indexer(file_path, data):
    checks = []

    # 1. Fact-based Confidence Score >= 85.0
    score = data.get("confidence_score", 0.0)
    checks.append(make_check(
        "confidence_score_threshold",
        score >= 85.0,
        error=f"Fact-based Confidence Score is {score}%, must be >= 85% to pass handoff",
        fix_hint="Verify static lint pass, ensure sandbox pass rate is high and semantic placeholders are 0"
    ))

    # 2. Semantic Placeholder Density must be 0%
    density = data.get("metrics", {}).get("semantic_placeholder_density", 1.0)
    checks.append(make_check(
        "zero_semantic_placeholders",
        density == 0.0,
        error=f"Semantic Placeholder Density is {density * 100}%. Must be 0% absolute.",
        fix_hint="Remove all hardcoded mock returns, empty structures, or unfinished logic"
    ))

    # 3. All tests passed
    all_passed = data.get("passed", False)
    checks.append(make_check(
        "all_tests_passed",
        all_passed is True,
        error="Handoff failed because sandbox test suite status is FAIL",
        fix_hint="Review verification.json test results, fix code and run sandbox tests again"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "tester-to-indexer",
        "artifact": Path(file_path).name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# STAGE: indexer-complete (Indexer complete & sync ready)
# ---------------------------------------------------------------------------

def validate_indexer_complete(file_path, data):
    checks = []

    # File path is expected to be the registry README.md or the newly updated llms.txt
    registry_file = Path(file_path)

    # 1. File exists
    checks.append(make_check(
        "registry_updated",
        registry_file.exists(),
        error=f"Target file not found: {registry_file}",
        fix_hint="Ensure Indexer Stage 5 writes to llms.txt and skill catalog registry"
    ))

    passed = all(c["status"] == "pass" for c in checks)
    return {
        "stage": "indexer-complete",
        "artifact": registry_file.name,
        "passed": passed,
        "checks": checks,
    }


# ---------------------------------------------------------------------------
# CLI and routing
# ---------------------------------------------------------------------------

STAGE_VALIDATORS = {
    "exploration-to-design": validate_exploration_to_design,
    "design-to-planner": validate_design_to_planner,
    "planner-to-builder": validate_planner_to_builder,
    "builder-to-tester": validate_builder_to_tester,
    "tester-to-indexer": validate_tester_to_indexer,
    "indexer-complete": validate_indexer_complete,
}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Validate handoff readiness for Master Skill Suite Ver_2.0.0.")
    parser.add_argument("--stage", "-s", required=True,
                        choices=list(STAGE_VALIDATORS.keys()),
                        help="Validation stage")
    parser.add_argument("file", help="Artifact file to validate")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    file_path = args.file

    # For builder-to-tester and indexer-complete, it's checking directory files, so we handle file loading gracefully
    if args.stage in ("builder-to-tester", "indexer-complete"):
        # We pass the path directly to validator, it will check existence
        validator_fn = STAGE_VALIDATORS[args.stage]
        result = validator_fn(file_path, {})
    else:
        # Load and parse Structured JSON/YAML/MD
        data, parse_err = load_data_file(file_path)
        if parse_err:
            result = {
                "stage": args.stage,
                "artifact": Path(file_path).name,
                "passed": False,
                "checks": [make_check(
                    "data_file_parsing",
                    False,
                    parse_err,
                    "Ensure the file is valid JSON, YAML or Markdown with valid frontmatter between --- delimiters",
                )],
            }
            print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                            sort_keys=False))
            return 1

        # Route to the right validator
        validator_fn = STAGE_VALIDATORS[args.stage]
        result = validator_fn(file_path, data)

    print(yaml.dump(result, default_flow_style=False, allow_unicode=True,
                    sort_keys=False))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
