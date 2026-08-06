"""Pytest fixtures for unit tests."""

import pytest
from src.models import Message, Category, SubCategory


@pytest.fixture
def sample_message_long() -> Message:
    """Fixture providing a sample long room listing message."""
    raw = (
        "Mã: A1204\n\n"
        "🏠 Địa chỉ: Nhà 158/70 Kim Giang - Quận: Thanh Xuân\n\n"
        "⏰ Trống\n\n"
        "💰 Giá: 4tr5\n\n"
        "✅ Nội thất: Full đồ\n\n"
        "✅ Dịch vụ: Điện 3k8, nước 35k\n\n"
        "❌ Lưu ý: Cọc 1 tháng"
    )
    return Message(id="msg_long_1", data_raw=raw, source_file="TNR/sample.json")


@pytest.fixture
def sample_message_heart() -> Message:
    """Fixture providing a heart reaction message."""
    return Message(id="msg_heart_1", data_raw="/-heart", source_file="sky_groub/sample.json")


@pytest.fixture
def sample_message_full() -> Message:
    """Fixture providing a full room notification message."""
    return Message(id="msg_full_1", data_raw="Địa chỉ: 165 Khương Thượng FULL ❌❌❌,", source_file="95_home/sample.json")
