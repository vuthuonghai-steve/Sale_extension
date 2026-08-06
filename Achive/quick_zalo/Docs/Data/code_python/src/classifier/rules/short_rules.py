"""Short message evaluation rules for follow-up and sub-category classification."""

import re
from typing import Optional
from src.classifier.rules.base_rule import AbstractRule
from src.models import Category, ClassificationResult, Message, Pattern, SubCategory


class PriceFollowupRule(AbstractRule):
    """Detects price follow-up messages starting with 'Giá [digit]'."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        return bool(re.search(r"^Giá\s+\d", message.data_raw.strip(), re.IGNORECASE))

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        result.sub_category = SubCategory.PRICE_FOLLOWUP
        result.patterns = [Pattern.PRICE_STARTS]
        result.confidence_score = 0.90


class PriceOnlyRule(AbstractRule):
    """Detects standalone price numbers (e.g. 4tr1, 5tr5, 500k)."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        s = message.data_raw.strip()
        return bool(re.match(r"^[\d.,]+\s*tr", s, re.IGNORECASE) or re.match(r"^[\d.,]+\s*k", s, re.IGNORECASE))

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        result.sub_category = SubCategory.PRICE_ONLY
        result.patterns = [Pattern.BARE_PRICE]
        result.confidence_score = 0.90


class RoomCodeRule(AbstractRule):
    """Detects Pxxx room codes with or without price."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        return bool(re.match(r"^[Pp]\s*\d{2,4}", message.data_raw.strip()))

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        raw = message.data_raw
        if re.search(r"\d+[.,]?\s*tr", raw, re.IGNORECASE):
            result.sub_category = SubCategory.ROOM_CODE_WITH_PRICE
            result.patterns = [Pattern.ROOM_CODE_WITH_PRICE]
        else:
            result.sub_category = SubCategory.ROOM_CODE_ONLY
            result.patterns = [Pattern.ROOM_CODE_ONLY]
        result.confidence_score = 0.90


class AxisRule(AbstractRule):
    """Detects 'Trục' (building axis) lines with or without price."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        return bool(re.match(r"^[Tt]rục", message.data_raw.strip(), re.IGNORECASE))

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        raw = message.data_raw
        if re.search(r"\d+[.,]?\s*tr", raw, re.IGNORECASE):
            result.sub_category = SubCategory.AXIS_WITH_PRICE
            result.patterns = [Pattern.AXIS_WITH_PRICE]
        else:
            result.sub_category = SubCategory.AXIS_ONLY
            result.patterns = [Pattern.AXIS_ONLY]
        result.confidence_score = 0.90


class MiscellaneousShortRule(AbstractRule):
    """Evaluates numeric room IDs, media notes, room types, floor info, and room descriptions."""

    def __init__(self) -> None:
        super().__init__(is_terminal=True)

    def matches(self, message: Message) -> bool:
        return len(message.data_raw) < 120

    def apply(self, message: Message, result: ClassificationResult) -> None:
        result.category = Category.SHORT_MESSAGE
        s = message.data_raw.strip()
        if re.match(r"^\d{3,4}\s*$", s):
            result.sub_category = SubCategory.NUMERIC_ROOM_ID
            result.patterns = [Pattern.BARE_ROOM_NUMBER]
            result.confidence_score = 0.90
        elif re.match(r"^(Ảnh|video)", s, re.IGNORECASE):
            result.sub_category = SubCategory.MEDIA_DESCRIPTION
            result.patterns = [Pattern.PHOTO_VIDEO_NOTE]
            result.confidence_score = 0.90
        elif re.match(r"^(Studio|1N1K|1n1k|2N1K|Gác xép|Giường tầng)", s, re.IGNORECASE):
            result.sub_category = SubCategory.ROOM_TYPE_LABEL
            result.patterns = [Pattern.ROOM_TYPE]
            result.confidence_score = 0.90
        elif re.match(r"^Tầng\s+\d+", s, re.IGNORECASE):
            result.sub_category = SubCategory.FLOOR_INFO
            result.patterns = [Pattern.FLOOR_NUMBER]
            result.confidence_score = 0.90
        elif re.match(r"^Phòng\s+", s, re.IGNORECASE):
            result.sub_category = SubCategory.ROOM_DESCRIPTION
            result.patterns = [Pattern.ROOM_DESC_SHORT]
            result.confidence_score = 0.90
        else:
            result.sub_category = SubCategory.UNKNOWN_SHORT
            result.patterns = [Pattern.UNRECOGNIZED]
            result.confidence_score = 0.10
