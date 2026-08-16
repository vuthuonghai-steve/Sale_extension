# Technical Trade-off Analyzer Skill

## 🎯 Tổng Quan

**Technical Trade-off Analyzer** là bộ kỹ năng cấp cao (Senior Architect & Trade-off Specialist) dành cho AI Agent trong môi trường phát triển ứng dụng desktop Windows Native C# .NET 6 (`app_forms`).

Bộ kỹ năng này hướng dẫn và điều hướng hành vi nhận thức của LLM:
- Chuyển từ suy nghĩ một chiều ("làm thế nào cho chạy được") sang **tư duy đánh đổi đa chiều (Gain vs. Pain)**.
- Phân loại rõ ràng tính khả nghịch của quyết định (**Type 1: One-Way Door** vs **Type 2: Two-Way Door**).
- Kích hoạt cơ chế **Reverse Probing** (đặt câu hỏi ngược về 5 kịch bản thất bại kinh điển trong Windows OS/WinForms).
- Cung cấp các mẫu tài liệu chuẩn mực (**Problem Framing**, **Option Matrix**, **ADR**).

---

## 🏛️ Cấu Trúc Mô-đun

```text
technical-tradeoff-analyzer/
├── SKILL.md                          # Tuyên ngôn năng lực, Boot sequence, Context Routing Matrix, Guardrails
├── README.md                         # Tài liệu giới thiệu tổng quan
├── metadata.json                     # Định danh và routing configuration
├── knowledge/                        # Khung tri thức nhận thức cốt lõi
│   ├── trade-off-dimensions.md       # 6 trục đánh đổi (Performance, Safety, Simplicity, Modularity, Testability, Blast Radius)
│   ├── decision-reversibility.md     # Type 1 vs Type 2 & Công thức Risk Index
│   └── reverse-probing-guide.md      # Tư duy phản biện ngược, 5 Failure Modes & Negative Space
├── playbook-native/                  # Các kịch bản đánh đổi thực tế trong dự án
│   ├── sidepanel-vs-dialog.md        # Giao diện Snap 1/4 Full Height vs Popup Modal
│   ├── sta-vs-async-thread.md        # STA Message Loop vs Background Channel
│   ├── unmanaged-vs-managed.md       # Win32 P/Invoke Direct vs Managed Memory
│   └── monolithic-vs-modular.md      # Single .csproj Monolith vs Multi-Project Separation
├── templates/                        # Mẫu tài liệu đầu ra
│   ├── problem-framing.template.md   # Phân tích bài toán & trích xuất ràng buộc
│   ├── option-matrix.template.md     # Bảng so sánh 6 chiều các phương án
│   └── adr-trade-off.template.md     # Architecture Decision Record
└── loop/                             # Kiểm soát chất lượng
    └── trade-off-checklist.md        # Bảng kiểm tra Pass/Fail trước khi bàn giao
```

---

## 🚀 Cách Kích Hoạt

Skill tự động kích hoạt khi người dùng yêu cầu:
- *"Phân tích đánh đổi giữa phương án A và phương án B"*
- *"So sánh các giải pháp kiến trúc"*
- *"Bóc tách bài toán và lập bảng problem framing"*
- *"Viết hồ sơ quyết định kiến trúc ADR"*
- *"Đánh giá rủi ro và blast radius khi sửa đổi module"*
