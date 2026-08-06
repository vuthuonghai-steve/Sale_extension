"""Classification engine module orchestrating strategies and batch processing."""

from typing import List, Optional
from src.classifier.strategy import RuleBasedStrategy
from src.interfaces import BaseClassifierStrategy
from src.models import ClassificationResult, Message


class ClassifierEngine:
    """Orchestrates message classification via injected ClassifierStrategy."""

    def __init__(self, strategy: Optional[BaseClassifierStrategy] = None) -> None:
        self.strategy = strategy or RuleBasedStrategy()

    def classify_message(self, message: Message) -> ClassificationResult:
        """Classify a single message."""
        return self.strategy.classify(message)

    def classify_all(self, messages: List[Message]) -> List[ClassificationResult]:
        """Classify a collection of messages."""
        return [self.classify_message(msg) for msg in messages]
