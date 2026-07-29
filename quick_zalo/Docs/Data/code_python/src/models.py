"""Domain models for Zalo Message Classification System.

Pure Python module defining data contracts with 0 external dependencies.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class Category(str, Enum):
    """Primary classification category."""
    ROOM_LISTING = "room_listing"
    SHORT_MESSAGE = "short_message"


class SubCategory(str, Enum):
    """Sub-category classification."""
    STRUCTURED_TEMPLATE = "structured_template"
    FREE_TEXT_LISTING = "free_text_listing"
    HEART_REACTION = "heart_reaction"
    FULL_NOTIFICATION = "full_notification"
    ADMIN_ANNOUNCEMENT = "admin_announcement"
    PRICE_FOLLOWUP = "price_followup"
    PRICE_ONLY = "price_only"
    ROOM_CODE_WITH_PRICE = "room_code_with_price"
    ROOM_CODE_ONLY = "room_code_only"
    AXIS_WITH_PRICE = "axis_with_price"
    AXIS_ONLY = "axis_only"
    NUMERIC_ROOM_ID = "numeric_room_id"
    MEDIA_DESCRIPTION = "media_description"
    ROOM_TYPE_LABEL = "room_type_label"
    FLOOR_INFO = "floor_info"
    ROOM_DESCRIPTION = "room_description"
    UNKNOWN_SHORT = "unknown_short"


class Pattern(str, Enum):
    """Pattern indicator tokens detected in messages."""
    HAS_MA_CODE = "has_ma_code"
    HAS_DIA_CHI = "has_dia_chi"
    HAS_HOUSE_EMOJI = "has_house_emoji"
    HAS_PRICE_EMOJI = "has_price_emoji"
    HAS_CHECK_CROSS = "has_check_cross"
    HAS_GIA = "has_gia"
    HAS_NOI_THAT = "has_noi_that"
    HAS_DICH_VU = "has_dich_vu"
    HAS_LUU_Y = "has_luu_y"
    HAS_THANG_MAY = "has_thang_may"
    HAS_ROSE_SLASH = "has_rose_slash"
    HAS_ROSE_EMOJI = "has_rose_emoji"
    HAS_KHAI_TRUONG = "has_khai_truong"
    HAS_UPDATE_OR_DISCOUNT = "has_update_or_discount"
    HAS_AVAILABILITY = "has_availability"
    HEART_REACTION = "heart_reaction"
    FULL_NOTIFICATION = "full_notification"
    ADMIN_AT_ALL = "admin_at_all"
    PRICE_STARTS = "price_starts"
    BARE_PRICE = "bare_price"
    ROOM_CODE_WITH_PRICE = "room_code_with_price"
    ROOM_CODE_ONLY = "room_code_only"
    AXIS_WITH_PRICE = "axis_with_price"
    AXIS_ONLY = "axis_only"
    BARE_ROOM_NUMBER = "bare_room_number"
    PHOTO_VIDEO_NOTE = "photo_video_note"
    ROOM_TYPE = "room_type"
    FLOOR_NUMBER = "floor_number"
    ROOM_DESC_SHORT = "room_desc_short"
    UNRECOGNIZED = "unrecognized"


@dataclass(frozen=True)
class Message:
    """Represents an extracted Zalo message."""
    id: str
    data_raw: str
    source_file: str


@dataclass
class ClassificationResult:
    """Complete classification output for a single message."""
    message: Message
    length: int
    is_long: bool
    category: Category
    sub_category: SubCategory
    patterns: List[Pattern] = field(default_factory=list)
    pattern_count: int = 0
    confidence_score: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize result to JSON-compatible dict."""
        return {
            "id": self.message.id,
            "source_file": self.message.source_file,
            "data_raw": self.message.data_raw,
            "length": self.length,
            "is_long": self.is_long,
            "category": self.category.value,
            "sub_category": self.sub_category.value,
            "patterns": [p.value for p in self.patterns],
            "pattern_count": self.pattern_count,
            "confidence_score": self.confidence_score,
            "metadata": self.metadata,
        }
