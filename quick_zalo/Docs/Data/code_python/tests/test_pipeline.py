"""End-to-end integration tests for ClassificationPipeline."""

from src.config import Config
from src.pipeline import ClassificationPipeline


def test_full_pipeline_run() -> None:
    config = Config()
    pipeline = ClassificationPipeline(config)
    result = pipeline.run()

    assert result.total_loaded == 3167
    assert result.validation_report.invalid_count == 0
    assert result.analysis_report.long_count == 1471
    assert result.analysis_report.short_count == 1696
