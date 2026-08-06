"""Unit tests for domain models."""

from src.models import Category, ClassificationResult, Message, Pattern, SubCategory


def test_message_creation() -> None:
    msg = Message(id="123", data_raw="Test content", source_file="test/file.json")
    assert msg.id == "123"
    assert msg.data_raw == "Test content"
    assert msg.source_file == "test/file.json"


def test_classification_result_to_dict(sample_message_heart: Message) -> None:
    res = ClassificationResult(
        message=sample_message_heart,
        length=len(sample_message_heart.data_raw),
        is_long=False,
        category=Category.SHORT_MESSAGE,
        sub_category=SubCategory.HEART_REACTION,
        patterns=[Pattern.HEART_REACTION],
        confidence_score=0.99,
    )
    d = res.to_dict()
    assert d["id"] == "msg_heart_1"
    assert d["category"] == "short_message"
    assert d["sub_category"] == "heart_reaction"
    assert d["patterns"] == ["heart_reaction"]
    assert d["confidence_score"] == 0.99
