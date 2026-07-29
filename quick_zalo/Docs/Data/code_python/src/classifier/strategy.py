"""Strategy implementation for rule-based message classification."""

from typing import List, Optional
from src.classifier.rules.base_rule import AbstractRule
from src.classifier.rules.registry import RuleRegistry
from src.classifier.template import TemplateDetector
from src.config import Config
from src.interfaces import BaseClassifierStrategy
from src.models import Category, ClassificationResult, Message, SubCategory


class RuleBasedStrategy(BaseClassifierStrategy):
    """Rule-based message classification strategy enforcing Clean Architecture and Strategy Pattern."""

    def __init__(self, config: Optional[Config] = None, rule_registry: Optional[RuleRegistry] = None) -> None:
        self.config = config or Config()
        registry = rule_registry or RuleRegistry()
        self.rules: List[AbstractRule] = registry.get_rules()
        self.template_detector = TemplateDetector()

    def classify(self, message: Message) -> ClassificationResult:
        """Classify message by evaluating ordered rule chain."""
        raw_len = len(message.data_raw)
        result = ClassificationResult(
            message=message,
            length=raw_len,
            is_long=raw_len >= self.config.long_threshold,
            category=Category.ROOM_LISTING if raw_len >= self.config.long_threshold else Category.SHORT_MESSAGE,
            sub_category=SubCategory.UNKNOWN_SHORT,
        )

        for rule in self.rules:
            if rule.matches(message):
                rule.apply(message, result)
                if rule.is_terminal:
                    break

        if result.is_long:
            tmpl_type = self.template_detector.detect_template(message)
            tmpl_fields = self.template_detector.extract_fields(message, tmpl_type)
            result.metadata = tmpl_fields

        return result
