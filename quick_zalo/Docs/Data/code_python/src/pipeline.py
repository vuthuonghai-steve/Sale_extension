"""Pipeline orchestration module for executing full classification process."""

import os
from dataclasses import dataclass
from typing import Optional
from src.analyzer import AnalysisReport, MessageAnalyzer
from src.classifier import ClassifierEngine
from src.config import Config
from src.loader import DataLoader
from src.reporter import ReportGenerator
from src.validator import DataValidator, ValidationReport


@dataclass
class PipelineResult:
    """Output results of executing classification pipeline."""
    total_loaded: int
    validation_report: ValidationReport
    analysis_report: AnalysisReport


class ClassificationPipeline:
    """Orchestrates end-to-end Zalo message classification pipeline."""

    def __init__(self, config: Optional[Config] = None) -> None:
        self.config = config or Config()
        self.loader = DataLoader()
        self.validator = DataValidator()
        self.engine = ClassifierEngine()
        self.analyzer = MessageAnalyzer()
        self.reporter = ReportGenerator(self.config)

    def run(self) -> PipelineResult:
        """Run the full classification pipeline stages."""
        messages = self.loader.load_all(self.config.raw_dir)
        val_report = self.validator.validate_all(messages)
        results = self.engine.classify_all(messages)
        analysis_report = self.analyzer.analyze(results)

        out_dir = self.config.output_dir
        self.reporter.export_json_summary(analysis_report, os.path.join(out_dir, "classification_summary.json"))
        self.reporter.export_all_messages_json(results, os.path.join(out_dir, "classification_all_messages.json"))
        self.reporter.export_markdown_report(analysis_report, os.path.join(out_dir, "bao-cao-phan-loai-chi-tiet.md"))

        return PipelineResult(
            total_loaded=len(messages),
            validation_report=val_report,
            analysis_report=analysis_report,
        )
