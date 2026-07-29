"""Unit tests for individual classification rules."""

from src.classifier.rules.length_rule import LengthRule
from src.classifier.rules.short_rules import PriceFollowupRule, PriceOnlyRule, RoomCodeRule
from src.classifier.rules.template_rules import TemplatePatternRule
from src.classifier.rules.terminal_rules import AdminAnnouncementRule, FullNotificationRule, HeartReactionRule
from src.models import Category, ClassificationResult, Message, Pattern, SubCategory


def test_heart_reaction_rule(sample_message_heart: Message) -> None:
    rule = HeartReactionRule()
    assert rule.matches(sample_message_heart)
    res = ClassificationResult(
        message=sample_message_heart,
        length=len(sample_message_heart.data_raw),
        is_long=False,
        category=Category.SHORT_MESSAGE,
        sub_category=SubCategory.UNKNOWN_SHORT,
    )
    rule.apply(sample_message_heart, res)
    assert res.sub_category == SubCategory.HEART_REACTION
    assert res.confidence_score == 0.99


def test_full_notification_rule(sample_message_full: Message) -> None:
    rule = FullNotificationRule()
    assert rule.matches(sample_message_full)
    res = ClassificationResult(
        message=sample_message_full,
        length=len(sample_message_full.data_raw),
        is_long=False,
        category=Category.SHORT_MESSAGE,
        sub_category=SubCategory.UNKNOWN_SHORT,
    )
    rule.apply(sample_message_full, res)
    assert res.sub_category == SubCategory.FULL_NOTIFICATION


def test_admin_announcement_rule() -> None:
    msg = Message(id="admin_1", data_raw="@All Thông báo nghỉ lễ", source_file="test.json")
    rule = AdminAnnouncementRule()
    assert rule.matches(msg)
    res = ClassificationResult(
        message=msg,
        length=len(msg.data_raw),
        is_long=False,
        category=Category.SHORT_MESSAGE,
        sub_category=SubCategory.UNKNOWN_SHORT,
    )
    rule.apply(msg, res)
    assert res.sub_category == SubCategory.ADMIN_ANNOUNCEMENT


def test_template_pattern_rule(sample_message_long: Message) -> None:
    rule = TemplatePatternRule()
    assert rule.matches(sample_message_long)
    res = ClassificationResult(
        message=sample_message_long,
        length=len(sample_message_long.data_raw),
        is_long=True,
        category=Category.ROOM_LISTING,
        sub_category=SubCategory.FREE_TEXT_LISTING,
    )
    rule.apply(sample_message_long, res)
    assert res.pattern_count >= 4
    assert res.sub_category == SubCategory.STRUCTURED_TEMPLATE
