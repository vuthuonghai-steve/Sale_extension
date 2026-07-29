"""ReportGenerator module for exporting structured JSON and Markdown summaries."""

import json
import os
from typing import Dict, List
from src.analyzer import AnalysisReport
from src.config import Config
from src.models import ClassificationResult


class ReportGenerator:
    """Generates JSON exports and Markdown summary reports."""

    def __init__(self, config: Config) -> None:
        self.config = config

    def export_json_summary(self, report: AnalysisReport, output_path: str) -> None:
        """Export analysis summary to JSON."""
        data = {
            "total_messages": report.total_messages,
            "threshold": self.config.long_threshold,
            "categories": report.category_distribution,
        }
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def export_all_messages_json(self, results: List[ClassificationResult], output_path: str) -> None:
        """Export all individual message results grouped by category."""
        grouped: Dict[str, List[dict]] = {}
        for r in results:
            key = f"{r.category.value}/{r.sub_category.value}"
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(r.to_dict())

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(grouped, f, ensure_ascii=False, indent=2)

    def export_markdown_report(self, report: AnalysisReport, output_path: str) -> None:
        """Generate human-readable Markdown report."""
        lines = [
            "# Báo Cáo Phân Loại Tin Nhắn Zalo",
            "",
            f"- **Tổng số tin nhắn**: {report.total_messages}",
            f"- **Ngưỡng phân loại độ dài**: {self.config.long_threshold} ký tự",
            f"- **Tin nhắn dài (>= {self.config.long_threshold})**: {report.long_count}",
            f"- **Tin nhắn ngắn (< {self.config.long_threshold})**: {report.short_count}",
            "",
            "## Thống Kê Theo Phân Loại",
            "",
            "| Category / SubCategory | Số Lượng | Tỷ Lệ (%) | Dải Độ Dài |",
            "|---|---|---|---|",
        ]
        for cat_key, info in report.category_distribution.items():
            l_min, l_max = info["length_range"]
            lines.append(f"| `{cat_key}` | {info['count']} | {info['percent']}% | {l_min} - {l_max} |")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
