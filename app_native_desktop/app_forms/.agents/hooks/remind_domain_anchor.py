#!/usr/bin/env python3
"""
Hook: remind_domain_anchor.py
In ra các lưu ý trọng tâm về Domain của dự án AppForms (Sale Lead Form Converter, Room Codes, Zalo Messages)
để nhắc nhở Agent giữ vững ngữ cảnh miền nghiệp vụ.
"""

import sys

DOMAIN_REMINDER = """
================================================================================
💡 DOMAIN ANCHOR - NHẮC NHỞ NGỮ CẢNH NGHIỆP VỤ (APPFORMS)
================================================================================
1. Nghiệp vụ cốt lõi: Tự động bắt Clipboard tin nhắn Zalo/Web chứa thông tin Lead bất động sản,
   làm sạch dữ liệu, tra cứu mã phòng (Room Code), parse thông tin và xuất ra Form chuẩn.
2. Dữ liệu hạt nhân:
   - Schemas: '0_Shared/Data/schemas.json' (Mẫu định dạng form đầu ra).
   - Room Codes: '0_Shared/Data/room_codes.json' (Tra cứu mã phòng và tòa nhà).
3. Logging: Luôn dùng Serilog / ILogger với structured log template, log vào file Session và Daily.
4. UI Pattern: Screen <= 150 dòng, tách Sub-components vào 'Components/', State vào 'Hooks/'.
================================================================================
"""

def main():
    print(DOMAIN_REMINDER)
    sys.exit(0)

if __name__ == "__main__":
    main()
