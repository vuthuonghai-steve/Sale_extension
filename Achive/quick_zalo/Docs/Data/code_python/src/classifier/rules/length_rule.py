"""Length threshold classification rule."""

from src.classifier.rules.base_rule import AbstractRule
from src.models import Category, ClassificationResult, Message


class LengthRule(AbstractRule):
    """Initial rule splitting messages by length threshold into ROOM_LISTING vs SHORT_MESSAGE."""

    def __init__(self, threshold: int = 120) -> None:
        super().__init__(is_terminal=False)
        self.threshold = threshold

    def matches(self, message: Message) -> bool:
        return True

    def apply(self, message: Message, result: ClassificationResult) -> None:
        raw_len = len(message.data_raw)
        result.length = raw_len
        result.is_long = raw_len >= self.threshold
        if result.is_long:
            result.category = Category.ROOM_LISTING
        else:
            result.category = Category.SHORT_MESSAGE
