"""Loader cau hinh chung: xac dinh repo root va nap rules.yaml."""

from functools import lru_cache
import os
from pathlib import Path
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
    """Nap config/rules.yaml; loi/missing -> {} (fail-safe, cache ket qua)."""
    candidates = [
        Path(__file__).resolve().parent / "rules.yaml",
        repo_root() / ".agents" / "hooks" / "scripts" / "config" / "rules.yaml",
        repo_root() / ".agents" / "hooks" / "rules.yaml",
    ]

    for path in candidates:
        try:
            if path.is_file():
                data = yaml.safe_load(path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    return data
        except Exception:
            continue
    return {}
