"""Template pattern matching rule for room listings."""

import re
from typing import List, Tuple
from src.classifier.rules.base_rule import AbstractRule
from src.models import ClassificationResult, Message, Pattern, SubCategory

PATTERN_REGEXES: List[Tuple[Pattern, re.Pattern]] = [
    (Pattern.HAS_MA_CODE, re.compile(r"\bMã\s*[: ]", re.IGNORECASE)),
    (Pattern.HAS_DIA_CHI, re.compile(r"Địa[ ]?chỉ", re.IGNORECASE)),
    (Pattern.HAS_HOUSE_EMOJI, re.compile(r"[🏠🕌🏡]")),
    (Pattern.HAS_PRICE_EMOJI, re.compile(r"[💰💸💵]")),
    (Pattern.HAS_CHECK_CROSS, re.compile(r"[✅❌]")),
    (Pattern.HAS_GIA, re.compile(r"Giá|giá")),
    (Pattern.HAS_NOI_THAT, re.compile(r"Nội thất|nội thất")),
    (Pattern.HAS_DICH_VU, re.compile(r"Dịch vụ|dịch vụ|Phí dv|phí dv", re.IGNORECASE)),
    (Pattern.HAS_LUU_Y, re.compile(r"Lưu ý|lưu ý")),
    (Pattern.HAS_THANG_MAY, re.compile(r"Thang máy|thang máy")),
    (Pattern.HAS_ROSE_SLASH, re.compile(r"/\-rose")),
    (Pattern.HAS_ROSE_EMOJI, re.compile(r"🌹")),
    (Pattern.HAS_KHAI_TRUONG, re.compile(r"KHAI TRƯƠNG|khai trương|Khai trương")),
    (Pattern.HAS_UPDATE_OR_DISCOUNT, re.compile(r"CẬP NHẬT|GIẢM GIÁ|giảm giá", re.IGNORECASE)),
    (Pattern.HAS_AVAILABILITY, re.compile(r"Trống|trống|ở được|vào ở", re.IGNORECASE)),
]


class TemplatePatternRule(AbstractRule):
    """Detects structured listing patterns in long room messages."""

    def __init__(self) -> None:
        super().__init__(is_terminal=False)

    def matches(self, message: Message) -> bool:
        return len(message.data_raw) >= 120

    def apply(self, message: Message, result: ClassificationResult) -> None:
        matched: List[Pattern] = []
        raw = message.data_raw
        for pattern_enum, regex in PATTERN_REGEXES:
            if regex.search(raw):
                matched.append(pattern_enum)

        result.patterns = matched
        result.pattern_count = len(matched)

        if len(matched) >= 4:
            result.sub_category = SubCategory.STRUCTURED_TEMPLATE
            result.confidence_score = min(0.95, 0.85 + (len(matched) * 0.01))
        else:
            result.sub_category = SubCategory.FREE_TEXT_LISTING
            result.confidence_score = 0.70 if len(matched) > 0 else 0.50
