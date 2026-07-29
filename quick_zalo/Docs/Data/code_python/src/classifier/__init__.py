"""Classifier engine and strategy package."""

from src.classifier.engine import ClassifierEngine
from src.classifier.strategy import RuleBasedStrategy
from src.classifier.template import TemplateDetector

__all__ = ["ClassifierEngine", "RuleBasedStrategy", "TemplateDetector"]
