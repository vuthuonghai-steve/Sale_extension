"""Loader cau hinh chung: xac dinh repo root va nap rules.yaml."""

from functools import lru_cache
import os
from pathlib import Path
import sys
import yaml


def repo_root() -> Path:
    """Tra ve thu muc repo goc (env HOOK_REPO_ROOT, walk-up, hoac cwd)."""
    env_root = os.environ.get("HOOK_REPO_ROOT")
    if env_root:
        return Path(env_root)

    current = Path(__file__).resolve().parent
    for candidate in (current, *current.parents):
        if (candidate / "AppForms.csproj").exists():
            return candidate
        if (candidate / ".agents").is_dir() and candidate.name != ".agents":
            return candidate
    return Path.cwd()


@lru_cache(maxsize=1)
def load_rules() -> dict:
    """Nap rules.yaml voi .agents/hooks/rules.yaml la Single Source of Truth; loi parse -> log stderr."""
    candidates = [
        repo_root() / ".agents" / "hooks" / "rules.yaml",
        Path(__file__).resolve().parents[2] / "rules.yaml",
        Path(__file__).resolve().parent / "rules.yaml",
    ]

    seen = set()
    for path in candidates:
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)

        if not resolved.is_file():
            continue

        try:
            content = resolved.read_text(encoding="utf-8")
            data = yaml.safe_load(content)
            if isinstance(data, dict):
                return data
            sys.stderr.write(f"[WARN] File cau hinh {resolved} khong chua YAML dict hop le.\n")
        except Exception as exc:
            sys.stderr.write(f"[WARN] Loi doc/parse YAML tu {resolved}: {exc}\n")

    return {}

