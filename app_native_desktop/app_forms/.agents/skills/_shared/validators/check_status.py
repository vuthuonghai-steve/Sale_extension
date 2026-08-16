#!/usr/bin/env python3
"""
check_status.py — Read and parse status block from design.md frontmatter

Usage:
    python check_status.py <design_path>
    
Output:
    JSON with status fields or error message
    
Exit Codes:
    0 = Success
    1 = Parse error (invalid YAML)
    2 = Missing status block
"""

import sys
import json
import yaml
import re
from pathlib import Path
from datetime import datetime, timezone

def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown file"""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    return yaml.safe_load(match.group(1))

def parse_timestamp(ts):
    """Parse ISO timestamp, return None if invalid"""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except ValueError:
        return None

def check_staleness(updated_str, max_days=7):
    """Check if checkpoint is stale"""
    updated = parse_timestamp(updated_str)
    if not updated:
        return None
    
    now = datetime.now(timezone.utc)
    age = (now - updated).days
    
    if age < max_days:
        return {"stale": False, "age_days": age}
    elif age < 30:
        return {"stale": True, "age_days": age, "level": "warning"}
    else:
        return {"stale": True, "age_days": age, "level": "danger"}

def check_status(design_path):
    """Main function to check status from design.md"""
    
    path = Path(design_path)
    if not path.exists():
        return {
            "error": f"File not found: {design_path}",
            "exit_code": 2
        }
    
    try:
        content = path.read_text()
    except Exception as e:
        return {
            "error": f"Cannot read file: {e}",
            "exit_code": 1
        }
    
    frontmatter = extract_frontmatter(content)
    if not frontmatter:
        return {
            "error": "No YAML frontmatter found",
            "exit_code": 2
        }
    
    status = frontmatter.get('status', {})
    if not status:
        return {
            "error": "No status block in frontmatter",
            "exit_code": 2
        }
    
    # Determine position
    phase = status.get('phase', 0)
    gates_passed = status.get('gates_passed', [])
    last_actor = status.get('last_actor', 'unknown')
    updated = status.get('updated', None)
    confidence = status.get('confidence', 0)
    
    # Check staleness
    staleness = check_staleness(updated)
    
    # Determine resume position
    if phase == 0:
        resume_from = "fresh_start"
    else:
        resume_from = f"phase_{phase}"
    
    result = {
        "exit_code": 0,
        "phase": phase,
        "gates_passed": gates_passed,
        "last_actor": last_actor,
        "confidence": confidence,
        "updated": updated,
        "resume_from": resume_from,
        "staleness": staleness,
        "skill_name": frontmatter.get('skill_name', 'unknown'),
        "stage": frontmatter.get('stage', 'unknown')
    }
    
    return result

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: check_status.py <design_path>",
            "exit_code": 1
        }, indent=2))
        sys.exit(1)
    
    design_path = sys.argv[1]
    result = check_status(design_path)
    
    print(json.dumps(result, indent=2))
    sys.exit(result.get('exit_code', 1))

if __name__ == "__main__":
    main()
