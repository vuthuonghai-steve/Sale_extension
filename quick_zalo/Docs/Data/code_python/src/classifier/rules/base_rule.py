"""Base rule definitions and abstract classes."""

from abc import ABC, abstractmethod
from src.interfaces import BaseRule
from src.models import Message, ClassificationResult


class AbstractRule(BaseRule, ABC):
    """Abstract rule helper with common priority/terminal defaults."""

    def __init__(self, is_terminal: bool = False) -> None:
        self._is_terminal = is_terminal

    @property
    def is_terminal(self) -> bool:
        return self._is_terminal
