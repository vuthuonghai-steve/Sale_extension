"""Unit tests for DataValidator module."""

from src.models import Message
from src.validator import DataValidator


def test_validator_valid_and_invalid() -> None:
    validator = DataValidator()
    valid_msg = Message(id="v1", data_raw="Content", source_file="src.json")
    invalid_msg = Message(id="", data_raw="Content", source_file="src.json")

    assert validator.validate_message(valid_msg) is True
    assert validator.validate_message(invalid_msg) is False

    report = validator.validate_all([valid_msg, invalid_msg])
    assert report.total_checked == 2
    assert report.valid_count == 1
    assert report.invalid_count == 1
    assert report.has_errors is True
