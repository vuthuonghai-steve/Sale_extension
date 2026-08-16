#!/usr/bin/env python3
"""
rollback_engine.py — Automate rollback procedures for the CASE System.
Allows reverting a skill context (.skill-context/{skill-name}/) to a previous stable gate checkpoint.

Usage:
    python rollback_engine.py <context_path> --to-phase <0|1|2|3> [--backup]
"""

import sys
import shutil
import re
from pathlib import Path
from datetime import datetime, timezone
import yaml

def extract_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None, content
    return yaml.safe_load(match.group(1)), content[match.end():]

def write_with_frontmatter(frontmatter, body):
    return f"---\n{yaml.safe_dump(frontmatter, sort_keys=False)}---\n{body}"

def backup_context(context_path):
    """Create a backup of the current context directory"""
    path = Path(context_path)
    if not path.exists():
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{path.name}_backup_{timestamp}"
    backup_path = path.parent / backup_name
    
    shutil.copytree(path, backup_path)
    return backup_path

def rollback_to_phase(context_path, target_phase, trigger_backup=True):
    path = Path(context_path)
    if not path.exists():
        print(f"ERROR: Context path not found: {context_path}")
        return False
        
    design_path = path / "design.md"
    if not design_path.exists():
        print(f"ERROR: design.md not found in context: {context_path}")
        return False
        
    if trigger_backup:
        bak = backup_context(context_path)
        if bak:
            print(f"Backup created successfully at: {bak.name}")
            
    # Read current design.md
    try:
        content = design_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"ERROR: Failed to read design.md: {e}")
        return False
        
    frontmatter, body = extract_frontmatter(content)
    if not frontmatter:
        print("ERROR: design.md has no valid frontmatter")
        return False
        
    status = frontmatter.get('status', {})
    if not status:
        status = {}
        
    current_phase = status.get('phase', 0)
    print(f"Current phase is: {current_phase}, requesting rollback to phase: {target_phase}")
    
    if target_phase >= current_phase:
        print(f"ERROR: Cannot rollback to a phase >= current phase ({target_phase} >= {current_phase})")
        return False
        
    # Revert status
    status['phase'] = target_phase
    
    # Revert gates passed list
    gates = []
    if target_phase >= 1:
        gates.append(1)
    if target_phase >= 2:
        gates.append(2)
    if target_phase >= 3:
        gates.append(3)
    status['gates_passed'] = gates
    
    # Update metadata
    status['last_actor'] = 'rollback_engine'
    status['updated'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    frontmatter['status'] = status
    
    # Write back to design.md
    try:
        new_content = write_with_frontmatter(frontmatter, body)
        design_path.write_text(new_content, encoding="utf-8")
        print(f"Successfully rolled back design.md status to Phase {target_phase}!")
    except Exception as e:
        print(f"ERROR: Failed to write design.md: {e}")
        return False
        
    # Revert other artifacts depending on target phase
    if target_phase < 2:
        todo_path = path / "todo.md"
        if todo_path.exists():
            todo_path.unlink()
            print("todo.md removed (rolled back prior to planning phase)")
            
    if target_phase < 3:
        build_log = path / "build-log.md"
        if build_log.exists():
            build_log.unlink()
            print("build-log.md removed (rolled back prior to builder phase)")
            
    return True

def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--to-phase':
        print("Usage: python rollback_engine.py <context_path> --to-phase <0|1|2|3> [--no-backup]")
        sys.exit(1)
        
    context_path = sys.argv[1]
    target_phase = int(sys.argv[3])
    
    no_backup = "--no-backup" in sys.argv
    
    success = rollback_to_phase(context_path, target_phase, trigger_backup=not no_backup)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
