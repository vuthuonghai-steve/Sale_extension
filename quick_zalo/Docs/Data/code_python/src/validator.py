"""DataValidator module for ensuring message data integrity and schema validity."""

from dataclasses import dataclass, field
from typing import List
from src.models import Message


@dataclass
class ValidationReport:
    """Validation status summary."""
    total_checked: int = 0
    valid_count: int = 0
    invalid_count: int = 0
    errors: List[str] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        """Check if any validation errors exist."""
        return self.invalid_count > 0


class DataValidator:
    """Validates Message instances for required fields and data sanitization."""

    def validate_message(self, message: Message) -> bool:
        """Verify if a single message is valid."""
        if not message.id or not isinstance(message.id, str):
            return False
        if message.data_raw is None or not isinstance(message.data_raw, str):
            return False
        return True

    def validate_all(self, messages: List[Message]) -> ValidationReport:
        """Validate a list of messages and produce a report."""
        report = ValidationReport(total_checked=len(messages))
        for msg in messages:
            if self.validate_message(msg):
                report.valid_count += 1
            else:
                report.invalid_count += 1
                report.errors.append(f"Invalid message ID: {getattr(msg, 'id', 'UNKNOWN')}")
        return report
