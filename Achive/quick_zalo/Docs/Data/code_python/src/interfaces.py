"""Abstract base classes and contracts for classification system interfaces."""

from abc import ABC, abstractmethod
from typing import List, Optional
from src.models import Message, ClassificationResult


class BaseClassifierStrategy(ABC):
    """Abstract Strategy interface for message classification."""

    @abstractmethod
    def classify(self, message: Message) -> ClassificationResult:
        """Classify a single message and return a ClassificationResult."""
        pass


class BaseRule(ABC):
    """Abstract Rule interface for rule-based classification."""

    @property
    @abstractmethod
    def is_terminal(self) -> bool:
        """If True, matching this rule immediately halts further rule evaluations."""
        pass

    @abstractmethod
    def matches(self, message: Message) -> bool:
        """Check if message satisfies the rule criteria."""
        pass

    @abstractmethod
    def apply(self, message: Message, result: ClassificationResult) -> None:
        """Mutate or populate ClassificationResult when rule matches."""
        pass
