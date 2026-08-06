"""Unit tests for MessageAnalyzer module."""

from src.analyzer import MessageAnalyzer
from src.classifier import ClassifierEngine
from src.models import Message


def test_analyzer_report(sample_message_long: Message, sample_message_heart: Message) -> None:
    engine = ClassifierEngine()
    results = engine.classify_all([sample_message_long, sample_message_heart])

    analyzer = MessageAnalyzer()
    report = analyzer.analyze(results)

    assert report.total_messages == 2
    assert report.long_count == 1
    assert report.short_count == 1
    assert "room_listing/structured_template" in report.category_distribution
    assert "short_message/heart_reaction" in report.category_distribution
