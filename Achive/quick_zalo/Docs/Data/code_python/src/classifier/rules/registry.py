"""RuleRegistry module for registering and retrieving ordered classification rules."""

from typing import List
from src.classifier.rules.base_rule import AbstractRule
from src.classifier.rules.length_rule import LengthRule
from src.classifier.rules.short_rules import (
    AxisRule,
    MiscellaneousShortRule,
    PriceFollowupRule,
    PriceOnlyRule,
    RoomCodeRule,
)
from src.classifier.rules.template_rules import TemplatePatternRule
from src.classifier.rules.terminal_rules import (
    AdminAnnouncementRule,
    FullNotificationRule,
    HeartReactionRule,
)


class RuleRegistry:
    """Registry maintaining prioritized sequence of classification rules."""

    def __init__(self) -> None:
        self.rules: List[AbstractRule] = [
            LengthRule(threshold=120),
            HeartReactionRule(),
            FullNotificationRule(),
            AdminAnnouncementRule(),
            TemplatePatternRule(),
            PriceFollowupRule(),
            PriceOnlyRule(),
            RoomCodeRule(),
            AxisRule(),
            MiscellaneousShortRule(),
        ]

    def get_rules(self) -> List[AbstractRule]:
        """Return the ordered list of registered rules."""
        return list(self.rules)
