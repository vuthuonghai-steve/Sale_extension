"""Configuration management module for Zalo Message Classification Pipeline."""

import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import yaml


@dataclass
class Config:
    """System configuration settings."""
    raw_dir: str = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/Raw"
    output_dir: str = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/result"
    long_threshold: int = 120
    confidence_thresholds: Dict[str, float] = field(default_factory=lambda: {
        "terminal": 0.99,
        "high_pattern": 0.90,
        "medium_pattern": 0.70,
        "low_pattern": 0.40,
        "unknown": 0.10,
    })
    export_formats: List[str] = field(default_factory=lambda: ["json", "markdown"])

    @classmethod
    def load_from_yaml(cls, yaml_path: str) -> "Config":
        """Load configuration from a YAML file."""
        if not os.path.exists(yaml_path):
            return cls()
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return cls(
            raw_dir=data.get("raw_dir", cls.raw_dir),
            output_dir=data.get("output_dir", cls.output_dir),
            long_threshold=data.get("long_threshold", cls.long_threshold),
            confidence_thresholds=data.get("confidence_thresholds", cls().confidence_thresholds),
            export_formats=data.get("export_formats", cls().export_formats),
        )
