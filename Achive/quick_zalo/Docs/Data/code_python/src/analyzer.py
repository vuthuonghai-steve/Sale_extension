"""MessageAnalyzer module for aggregating classification metrics and stats."""

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List
from src.models import ClassificationResult


@dataclass
class AnalysisReport:
    """Summary metrics of classification results."""
    total_messages: int = 0
    long_count: int = 0
    short_count: int = 0
    category_distribution: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    group_summary: Dict[str, Dict[str, Any]] = field(default_factory=dict)


class MessageAnalyzer:
    """Computes distribution statistics over ClassificationResult lists."""

    def analyze(self, results: List[ClassificationResult]) -> AnalysisReport:
        """Compute aggregated statistics across classification results."""
        report = AnalysisReport(total_messages=len(results))
        cat_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "count": 0, "patterns": defaultdict(int), "lengths": [], "sources": set()
        })
        groups: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "long": 0, "short": 0})

        for r in results:
            self._process_single_result(r, report, cat_stats, groups)

        self._format_category_dist(report, cat_stats)
        self._format_group_dist(report, groups)
        return report

    def _process_single_result(
        self,
        r: ClassificationResult,
        report: AnalysisReport,
        cat_stats: Dict[str, Dict[str, Any]],
        groups: Dict[str, Dict[str, int]],
    ) -> None:
        """Update aggregation accumulators for a single result."""
        if r.is_long:
            report.long_count += 1
        else:
            report.short_count += 1

        cat_key = f"{r.category.value}/{r.sub_category.value}"
        node = cat_stats[cat_key]
        node["count"] += 1
        node["lengths"].append(r.length)
        node["sources"].add(r.message.source_file)
        for p in r.patterns:
            node["patterns"][p.value] += 1

        g_name = r.message.source_file.split("/")[0] if "/" in r.message.source_file else "default"
        g_node = groups[g_name]
        g_node["total"] += 1
        if r.is_long:
            g_node["long"] += 1
        else:
            g_node["short"] += 1

    def _format_category_dist(self, report: AnalysisReport, cat_stats: Dict[str, Dict[str, Any]]) -> None:
        """Format category distribution dictionary."""
        total = report.total_messages or 1
        for cat_key, stat in cat_stats.items():
            cat_part, sub_part = cat_key.split("/")
            report.category_distribution[cat_key] = {
                "category": cat_part,
                "sub_category": sub_part,
                "count": stat["count"],
                "percent": round((stat["count"] / total) * 100, 1),
                "length_range": [min(stat["lengths"]), max(stat["lengths"])],
                "source_files": sorted(list(stat["sources"])),
                "pattern_summary": dict(stat["patterns"]),
            }

    def _format_group_dist(self, report: AnalysisReport, groups: Dict[str, Dict[str, int]]) -> None:
        """Format group summary dictionary."""
        for g_name, g_stat in groups.items():
            g_tot = g_stat["total"] or 1
            report.group_summary[g_name] = {
                "total": g_stat["total"],
                "long": g_stat["long"],
                "short": g_stat["short"],
                "long_percent": round((g_stat["long"] / g_tot) * 100, 1),
                "short_percent": round((g_stat["short"] / g_tot) * 100, 1),
            }
