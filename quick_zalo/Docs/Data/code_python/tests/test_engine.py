"""Unit tests for ClassifierEngine and RuleBasedStrategy orchestration."""

from src.classifier.engine import ClassifierEngine
from src.classifier.strategy import RuleBasedStrategy
from src.models import Category, Message, SubCategory


def test_classifier_engine_long_message(sample_message_long: Message) -> None:
    engine = ClassifierEngine(RuleBasedStrategy())
    result = engine.classify_message(sample_message_long)
    assert result.is_long is True
    assert result.category == Category.ROOM_LISTING
    assert result.sub_category == SubCategory.STRUCTURED_TEMPLATE
    assert "ma_code" in result.metadata


def test_classifier_engine_heart_message(sample_message_heart: Message) -> None:
    engine = ClassifierEngine(RuleBasedStrategy())
    result = engine.classify_message(sample_message_heart)
    assert result.is_long is False
    assert result.category == Category.SHORT_MESSAGE
    assert result.sub_category == SubCategory.HEART_REACTION
