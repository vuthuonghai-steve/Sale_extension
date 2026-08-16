#!/usr/bin/env python3
"""
init_context.py — Khoi tao cau truc thu muc .skill-context/{target_skill}/

Tao thu muc context va cac file template cho skill moi.
Safe-create policy: KHONG ghi de file da ton tai.

Usage:
    python init_context.py <skill-name>

Example:
    python init_context.py my-api-analyzer
"""

import sys
import os
import re
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

KEBAB_CASE_PATTERN = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")
MAX_WALK_UP_LEVELS = 10

# ---------------------------------------------------------------------------
# Shared bootstrap: auto-extract _shared.zip if missing
# ---------------------------------------------------------------------------

def ensure_shared_bundled(script_dir: Path) -> Path:
    """Check if ../_shared/ exists. If not, auto-extract from references/_shared.zip.

    Returns path to _shared/ directory.
    Raises RuntimeError if extraction fails.
    """
    skill_root = script_dir.parent  # skill-architect/
    shared_dir = skill_root.parent / "_shared"  # ../_shared/

    if shared_dir.is_dir():
        return shared_dir

    # _shared missing — try bundled zip
    zip_path = skill_root / "references" / "_shared.zip"
    if not zip_path.is_file():
        raise RuntimeError(
            f"_shared/ not found at {shared_dir} and bundled zip not found at {zip_path}. "
            "Ensure the skill package includes references/_shared.zip or install _shared/ separately."
        )

    # Extract to skill_root's parent (where _shared/ should live)
    extract_target = skill_root.parent
    print(f"  [BOOT] _shared/ missing. Extracting {zip_path} -> {extract_target}", file=sys.stderr)
    try:
        result = subprocess.run(
            ["unzip", "-q", "-o", str(zip_path), "-d", str(extract_target)],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(
            f"Failed to extract {zip_path}: {e.stderr or e.stdout}"
        ) from e
    except FileNotFoundError:
        # unzip not available — fallback to Python zipfile
        import zipfile
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(path=extract_target)

    if not shared_dir.is_dir():
        raise RuntimeError(
            f"Extraction succeeded but {shared_dir} still missing. "
            "Check zip contents."
        )

    print(f"  [BOOT] _shared/ extracted successfully.", file=sys.stderr)
    return shared_dir

TEMPLATE_FILES = {
    "design.md": "design.md.template",
    "todo.md": "todo.md.template",
    "build-log.md": "build-log.md.template",
}

PLACEHOLDERS = {
    "{skill_name}": "",   # filled at runtime
    "{date}": "",         # filled at runtime
    "{generated_at}": "", # filled at runtime
    "{author}": "Skill Architect",
}

FALLBACK_TEMPLATES = {
    "design.md": "---\nskill_schema_version: \"3.0.0\"\nartifact_type: \"design\"\nskill_name: \"{skill_name}\"\ngenerated_by: \"skill-architect\"\ngenerated_at: \"{generated_at}\"\nstage: \"architect\"\nstatus: \"in_progress\"\ncanonical_source:\n  zone_mapping: \"frontmatter.zone_mapping\"\n  progressive_disclosure: \"frontmatter.progressive_disclosure\"\nzone_mapping:\n  core:\n    files:\n      - path: \"SKILL.md\"\n        file_required: true\n        content_type: \"persona-definition\"\n    zone_required: true\n  knowledge:\n    files:\n      - path: \"knowledge/{skill_name}-rules.md\"\n        file_required: true\n        content_type: \"domain-knowledge\"\n    zone_required: true\n  scripts:\n    files: []\n    zone_required: false\n  templates:\n    files: []\n    zone_required: false\n  data:\n    files: []\n    zone_required: false\n  loop:\n    files:\n      - path: \"loop/checklist.md\"\n        file_required: true\n        content_type: \"quality-gate\"\n    zone_required: true\n  assets:\n    files: []\n    zone_required: false\nprogressive_disclosure:\n  tier1:\n    - path: \"SKILL.md\"\n      base: \"skill_dir\"\n    - path: \"loop/checklist.md\"\n      base: \"skill_dir\"\n  tier2:\n    - path: \"knowledge/{skill_name}-rules.md\"\n      base: \"skill_dir\"\n      load_when: \"executing core logic\"\n  tier3: []\nrequired_sections:\n  - \"1_problem_statement\"\n  - \"2_capability_map\"\n  - \"3_zone_mapping\"\n  - \"4_folder_structure\"\n  - \"5_execution_flow\"\n  - \"6_interaction_points\"\n  - \"7_progressive_disclosure\"\n  - \"8_risks\"\n  - \"9_open_questions\"\n  - \"10_metadata\"\nhandoff:\n  next_stage: \"planner\"\n  ready_condition:\n    required:\n      frontmatter_valid: true\n      zone_mapping_complete: true\n      required_sections_present: true\n      no_blockers: true\n---\n\n# {skill_name} — Architecture Design\n\n> Generated: {date}\n\n## 1. Problem Statement\n\n## 2. Capability Map\n\n## 3. Zone Mapping\n\n## 4. Folder Structure\n\n## 5. Execution Flow\n\n## 6. Interaction Points\n\n## 7. Progressive Disclosure Plan\n\n## 8. Risks & Blind Spots\n\n## 9. Open Questions\n\n## 10. Metadata\n",
    "todo.md": "---\nskill_schema_version: \"3.0.0\"\nartifact_type: \"todo\"\nskill_name: \"{skill_name}\"\ngenerated_by: \"skill-planner\"\ngenerated_at: \"{generated_at}\"\nstage: \"planner\"\nstatus: \"in_progress\"\ntrace_to_design: \"design.md\"\nphases:\n  - id: \"PH0\"\n    name: \"Prepare\"\n    tasks:\n      - id: \"T0.1\"\n        title: \"Review design.md and gather resources\"\n        zone: \"knowledge\"\n        priority: \"critical\"\n        trace: \"design.§2\"\n        depends_on: []\n        status: \"pending\"\n        file_target: \"knowledge/\"\n        acceptance_criteria:\n          - \"All required docs identified\"\n  - id: \"PH1\"\n    name: \"Build Core\"\n    tasks:\n      - id: \"T1.1\"\n        title: \"Create SKILL.md\"\n        zone: \"core\"\n        priority: \"critical\"\n        trace: \"design.§3.core\"\n        depends_on: []\n        status: \"pending\"\n        file_target: \"SKILL.md\"\n        acceptance_criteria:\n          - \"YAML frontmatter present\"\n          - \"All guardrails defined\"\nblockers: []\nprerequisites:\n  - item: \"Domain knowledge about {skill_name}\"\n    tier: \"domain\"\n    status: \"missing\"\n    action_if_missing: \"Research and document\"\n  - item: \"Technical standards\"\n    tier: \"technical\"\n    status: \"ready\"\n    resource_file: \"knowledge/standards.md\"\nhandoff:\n  next_stage: \"builder\"\n  ready_condition:\n    required:\n      blockers_empty: true\n      phase0_done: true\n      prerequisites_ready: true\n      schema_valid: true\n      design_zones_covered: true\n---\n\n# {skill_name} — Implementation Plan\n\n> Generated: {date}\n\n## 1. Pre-requisites\n\n## 2. Phase Breakdown\n\n## 3. Knowledge & Resources Needed\n\n## 4. Definition of Done\n\n## 5. Notes\n",
    "build-log.md": "---\nskill_schema_version: \"3.0.0\"\nartifact_type: \"build-log\"\nskill_name: \"{skill_name}\"\ngenerated_by: \"skill-builder\"\ngenerated_at: \"{generated_at}\"\nstage: \"builder\"\nstatus: \"in_progress\"\nexecution_trace:\n  - timestamp: \"{generated_at}\"\n    phase: \"PH1\"\n    task_id: \"T1.1\"\n    action: \"CREATE_FILE\"\n    file: \"SKILL.md\"\n    status: \"success\"\n    notes: \"Initial file created\"\n    decision: \"CONTINUE\"\nfeedback_to_planner: []\nfeedback_to_architect: []\nquality_metrics:\n  placeholder_ratio: 0.0\n  critical_tasks_done: false\n  validator_pass: false\n---\n\n# {skill_name} — Build Log\n\n> Generated: {date}\n\n## 1. Build Session Log\n\n## 2. Files Created\n\n## 3. Decisions Made During Build\n\n## 4. Issues Encountered\n\n## 5. Final Status\n",
}


# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

def find_project_root(start_dir: Path) -> Path | None:
    """Walk up from start_dir to find the directory containing .claude/."""
    current = start_dir.resolve()
    for _ in range(MAX_WALK_UP_LEVELS):
        if (current / ".claude").is_dir():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def validate_skill_name(name: str) -> bool:
    """Check that skill name is valid kebab-case."""
    return bool(KEBAB_CASE_PATTERN.match(name))


def resolve_template_content(
    template_name: str, output_name: str, templates_dir: Path
) -> str:
    """Read template file or return fallback content."""
    template_path = templates_dir / template_name
    if template_path.is_file():
        return template_path.read_text(encoding="utf-8")

    print(f"  WARNING: Template '{template_name}' not found, using fallback")
    return FALLBACK_TEMPLATES.get(output_name, f"# {output_name}\n")


def replace_placeholders(content: str, replacements: dict[str, str]) -> str:
    """Replace all placeholders in content."""
    for placeholder, value in replacements.items():
        content = content.replace(placeholder, value)
    return content


def safe_create_file(filepath: Path, content: str) -> str:
    """Create file only if it does not exist. Return status string."""
    if filepath.exists():
        return "SKIPPED (already exists)"
    filepath.write_text(content, encoding="utf-8")
    return "CREATED"


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(description="Initialize .skill-context/{target_skill}/ directory structure")
    parser.add_argument("skill_name", help="Skill name in kebab-case (e.g., my-api-analyzer)")
    parser.add_argument("--project-root", default=None, help="Project root path (default: auto-detect)")
    parser.add_argument("--context-dir", default=None, help="Context directory path (default: {project-root}/.skill-context/{target_skill})")
    parser.add_argument("--skills-root", default=None, help="Skills root path (default: parent of skill-architect)")
    args = parser.parse_args()
    
    skill_name = args.skill_name

    if not validate_skill_name(skill_name):
        print(f"Error: '{skill_name}' is not valid kebab-case.")
        print("  Use lowercase letters, numbers, and hyphens only.")
        print("  Example: my-api-analyzer, error-handler, sequence-diagram")
        return 1

    # --- Bootstrap _shared/ if missing ---
    script_dir = Path(__file__).resolve().parent  # Define early for ensure_shared_bundled
    try:
        ensure_shared_bundled(script_dir)
    except RuntimeError as e:
        print(f"[BOOT WARNING] {e}", file=sys.stderr)

    # --- Detect project root (supports --project-root override) ---
    if args.project_root:
        project_root = Path(args.project_root)
    else:
        project_root = find_project_root(Path.cwd())
        if project_root is None:
            print("Error: Could not find .claude/ directory.")
            print("  Run this script from within the project directory.")
            return 1

    print(f"Project root: {project_root}")

    # --- Resolve paths (supports --context-dir and --skills-root overrides) ---
    if args.context_dir:
        context_root = Path(args.context_dir).parent
        skill_context_dir = Path(args.context_dir)
    else:
        context_root = project_root / ".skill-context"
        skill_context_dir = context_root / skill_name
    resources_dir = skill_context_dir / "resources"
    templates_dir = script_dir.parent / "templates"

    # --- Prepare placeholders ---
    now_iso = datetime.now(timezone.utc).isoformat()
    replacements = {
        "{skill_name}": skill_name,
        "{date}": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "{generated_at}": now_iso,
        "{author}": "Skill Architect",
    }

    # --- Create directories ---
    context_root.mkdir(exist_ok=True)
    skill_context_dir.mkdir(exist_ok=True)
    resources_dir.mkdir(exist_ok=True)

    print(f"\nContext directory: {skill_context_dir}")
    print("-" * 50)

    # --- Create files from templates ---
    results = []
    for output_name, template_name in TEMPLATE_FILES.items():
        raw_content = resolve_template_content(
            template_name, output_name, templates_dir
        )
        content = replace_placeholders(raw_content, replacements)
        filepath = skill_context_dir / output_name
        status = safe_create_file(filepath, content)
        results.append((output_name, status))
        print(f"  {output_name:20s} → {status}")

    # --- Summary ---
    created_count = sum(1 for _, s in results if s == "CREATED")
    skipped_count = sum(1 for _, s in results if "SKIPPED" in s)
    print(f"\nDone: {created_count} created, {skipped_count} skipped")
    print(f"Resources dir: {resources_dir}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
