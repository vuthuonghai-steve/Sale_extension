"""Terminal classification rules for exclusive short message types including edge cases."""

import re
from src.classifier.rules.base_rule import AbstractRule
from src.models import Category, ClassificationResult, Message, Pattern, SubCategory


class HeartReactionRule(AbstractRule):
    """Detects /-heart reaction messages and short reaction stickers."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)
        self.slash_pattern = re.compile(r"/(?:[-:]\w+|[-heart]+)", re.IGNORECASE)
        self.emoji_pattern = re.compile(r"^[❤️💕💖👍🌹\s]+$")

    def matches(self, message: Message) -> bool:
        raw = message.data_raw.strip()
        # Slash codes match regardless of length
        if "/-heart" in raw or self.slash_pattern.search(raw):
            return True
        # Emoji reactions apply only to short messages (< 120 chars)
        if len(raw) < 120 and self.emoji_pattern.match(raw):
            return True
        return False

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        result.sub_category = SubCategory.HEART_REACTION
        result.patterns = [Pattern.HEART_REACTION]
        result.confidence_score = 0.99


class FullNotificationRule(AbstractRule):
    """Detects FULL vacancy / full room notification messages including typos and emojis."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)
        self.pattern = re.compile(
            r"(?i)\b(?:FULL|HẾT(?:\s*PHÒNG|\s*P)?|ĐÃ\s*CỌC|CỌC\s*RỒI|ĐÃ\s*THUÊ|ĐÃ\s*BÁN|FULK)\b|[❌⛔🔒]",
            re.IGNORECASE,
        )

    def matches(self, message: Message) -> bool:
        raw = message.data_raw.strip()
        if len(raw) >= 120:
            return False
        return bool(self.pattern.search(raw))

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        result.sub_category = SubCategory.FULL_NOTIFICATION
        result.patterns = [Pattern.FULL_NOTIFICATION]
        result.confidence_score = 0.99


class AdminAnnouncementRule(AbstractRule):
    """Detects @All or @user admin announcements."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        s = message.data_raw.strip()
        return bool(s.startswith("@All") or s.startswith("@") or "bảng giá" in s.lower())

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        result.sub_category = SubCategory.ADMIN_ANNOUNCEMENT
        result.patterns = [Pattern.ADMIN_AT_ALL]
        result.confidence_score = 0.99
