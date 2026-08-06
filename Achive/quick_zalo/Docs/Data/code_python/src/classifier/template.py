"""TemplateDetector module for structural analysis of Zalo listing templates."""

import re
from enum import Enum
from typing import Any, Dict
from src.models import Message


class TemplateType(str, Enum):
    """Known real-estate Zalo message template types."""
    TNR_STANDARD = "tnr_standard"
    SKY_GROUP = "sky_group"
    HOME_95 = "home_95"
    GENERIC = "generic"


class TemplateDetector:
    """Detects specific structural templates in Zalo messages."""

    def detect_template(self, message: Message) -> TemplateType:
        """Identify template origin/signature from message content."""
        raw = message.data_raw
        if "Mã" in raw and "Nội thất" in raw and "Dịch vụ" in raw:
            return TemplateType.TNR_STANDARD
        if "🌹" in raw and "Khai Trương" in raw:
            return TemplateType.HOME_95
        if "Phòng Trống" in message.source_file or "/-rose" in raw:
            return TemplateType.SKY_GROUP
        return TemplateType.GENERIC

    def extract_fields(self, message: Message, template_type: TemplateType) -> Dict[str, Any]:
        """Extract template-specific key-value pairs."""
        raw = message.data_raw
        fields: Dict[str, Any] = {"template": template_type.value}
        ma_match = re.search(r"Mã\s*[: ]\s*([A-Za-z0-9]+)", raw)
        if ma_match:
            fields["ma_code"] = ma_match.group(1)
        addr_match = re.search(r"Địa\s*chỉ\s*[: ]\s*([^\n]+)", raw)
        if addr_match:
            fields["address"] = addr_match.group(1).strip()
        return fields
