"""Script to generate detailed room template analysis report."""

import json
import os


def generate_report() -> None:
    json_path = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/result/classification_all_messages.json"
    output_path = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/result/bao_cao_chi_tiet_template_phong.md"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    templates = data.get("room_listing/structured_template", [])
    free_texts = data.get("room_listing/free_text_listing", [])

    tnr_templates = [m for m in templates if "TNR" in m.get("source_file", "")]
    sky_templates = [m for m in templates if "sky_groub" in m.get("source_file", "")]
    home95_templates = [m for m in templates if "95_home" in m.get("source_file", "")]

    total_room_listings = len(templates) + len(free_texts)

    lines = [
        "# BÁO CÁO PHÂN LOẠI CHI TIẾT TÊN VÀ CẤU TRÚC TIN NHẮN THÔNG TIN PHÒNG ZALO",
        "",
        "**Ngày báo cáo**: 2026-07-29",
        "**Tổng số tin nhắn hệ thống đã quét**: 3,167 tin nhắn",
        "",
        "---",
        "",
        "## 1. DẠNG BẢNG TỔNG QUAN PHÂN LOẠI TIN NHẮN PHÒNG",
        "",
        f"- **Tổng số tin nhắn thông tin phòng thực tế (Room Listings)**: **{total_room_listings}** tin nhắn",
        f"- **Tin nhắn có cấu trúc thông tin (Structured Template)**: **{len(templates)}** tin nhắn ({round((len(templates)/total_room_listings)*100, 1)}%)",
        f"- **Tin nhắn không có cấu trúc (Free-Text Listing)**: **{len(free_texts)}** tin nhắn ({round((len(free_texts)/total_room_listings)*100, 1)}%)",
        "",
        "| Phân Loại Tin Nhắn | Mã / Tên Mẫu Template | Số Lượng | Tỷ Lệ (%) | Đặc Điểm Nhận Diện |",
        "|---|---|---|---|---|",
        f"| **Có Cấu Trúc** | `TNR Standard Template` | {len(tnr_templates)} | {round((len(tnr_templates)/total_room_listings)*100, 1)}% | `Mã:`, `🏠Địa chỉ:`, `⏰ Trống`, `💰 Giá:`, `✅ Nội thất:`, `❌ Lưu ý:` |",
        f"| **Có Cấu Trúc** | `95 Home Commission Template` | {len(home95_templates)} | {round((len(home95_templates)/total_room_listings)*100, 1)}% | `🌹30%`, `🏡KHAI TRƯƠNG`, `🕌 Địa chỉ:`, `⚡ Chi phí dv:`, `🛋 Nội thất:` |",
        f"| **Có Cấu Trúc** | `Sky Group Availability Template` | {len(sky_templates)} | {round((len(sky_templates)/total_room_listings)*100, 1)}% | `Phòng Trống`, `🏠`, `💸`, `👉`, Dịch vụ điện 4k, nước 35k |",
        f"| **Không Cấu Trúc** | `Free-Text Listing` | {len(free_texts)} | {round((len(free_texts)/total_room_listings)*100, 1)}% | Văn bản mô tả tự do, thiếu biểu tượng chuẩn hóa hoặc không chia mục |",
        "",
        "---",
        "",
        "## 2. CHI TIẾT CÁC MẪU TEMPLATE CẤU TRÚC TIN NHẮN (STRUCTURED TEMPLATES)",
        "",
        f"### 🏢 1. TNR Standard Template ({len(tnr_templates)} tin nhắn)",
        "**Đặc điểm cấu trúc chuẩn hoá**:",
        "- **Mã phòng**: `Mã [A-Z0-9]+` (Ví dụ: `Mã: A1204`, `Mã: B16`)",
        "- **Địa chỉ**: `🏠Địa chỉ:` hoặc `🏠 Địa chỉ:`",
        "- **Tình trạng**: `⏰ Trống` hoặc `⏰ 1/8 Trống`",
        "- **Giá & Loại phòng**: `💰 Giá:`, `👉Loại phòng:` / `👉Dạng phòng:`",
        "- **Dịch vụ & Nội thất**: `✅ Nội thất:`, `✅ Dịch vụ:`",
        "- **Lưu ý**: `❌ Lưu ý:`",
        "",
        "#### Mẫu Ví Dụ Thực Tế 1 (TNR Standard):",
        "```text",
        tnr_templates[0]["data_raw"] if tnr_templates else "",
        "```",
        "",
        "#### Mẫu Ví Dụ Thực Tế 2 (TNR Standard):",
        "```text",
        tnr_templates[1]["data_raw"] if len(tnr_templates) > 1 else "",
        "```",
        "",
        f"### 🌺 2. 95 Home Commission Template ({len(home95_templates)} tin nhắn)",
        "**Đặc điểm cấu trúc chuẩn hoá**:",
        "- **Tỷ lệ Hoa hồng CTV**: Bắt đầu bằng `🌹30%`, `🌹40%`, `🌹30-40% HĐ 6-12T`",
        "- **Tiêu đề sự kiện**: `🏡KHAI TRƯƠNG TÒA MỚI`, `🎉🎉 Khai trương toà mới`",
        "- **Địa chỉ**: `🕌 Địa chỉ:`",
        "- **Giá thuê & Dịch vụ**: `💰 Giá thuê:`, `⚡ Chi phí dịch vụ:`",
        "- **Nội thất & Lưu ý**: `🛋 Nội thất:`, `❌ K nuôi Pet`, `✅ Ở 2 người`",
        "",
        "#### Mẫu Ví Dụ Thực Tế 1 (95 Home):",
        "```text",
        home95_templates[0]["data_raw"] if home95_templates else "",
        "```",
        "",
        "#### Mẫu Ví Dụ Thực Tế 2 (95 Home):",
        "```text",
        home95_templates[1]["data_raw"] if len(home95_templates) > 1 else "",
        "```",
        "",
        f"### ☁️ 3. Sky Group Availability Template ({len(sky_templates)} tin nhắn)",
        "**Đặc điểm cấu trúc chuẩn hoá**:",
        "- **Khu vực / Tên tòa**: Cụm thông tin `Phòng Trống Sky Group`",
        "- **Biểu tượng phòng & giá**: `🏠`, `💸`, `👉`",
        "- **Thông số chi tiết**: Điện 4k, nước 35k/khối, dịch vụ chung 150k/người",
        "",
        "#### Mẫu Ví Dụ Thực Tế 1 (Sky Group):",
        "```text",
        sky_templates[0]["data_raw"] if sky_templates else "",
        "```",
        "",
        "---",
        "",
        "## 3. DANH SÁCH & PHÂN TÍCH TIN NHẮN KHÔNG CÓ CẤU TRÚC (FREE-TEXT LISTINGS)",
        "",
        f"Tổng số tin nhắn thông tin phòng không theo template cấu trúc: **{len(free_texts)}** tin nhắn.",
        "**Đặc điểm**: Đăng tải thông tin phòng bằng đoạn văn mô tả tự do, thiếu biểu tượng định dạng (như `🏠`, `💰`), hoặc viết gộp không chia dòng rõ ràng.",
        "",
    ]

    for i, m in enumerate(free_texts[:5], 1):
        lines.append(f"### Mẫu Tự Do {i} (ID: `{m.get('id', '')}`):")
        lines.append(f"**Nguồn**: `{m.get('source_file', '')}`")
        lines.append("```text")
        lines.append(m.get("data_raw", ""))
        lines.append("```")
        lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"✅ Generated report successfully at: {output_path}")


if __name__ == "__main__":
    generate_report()
