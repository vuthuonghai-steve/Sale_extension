# 📘 BA Requirements Analyzer — Kỹ Thuật Phân Tích & Phân Loại Requirements Chuẩn BABOK

Kỹ năng chuyên sâu dành cho **Lead Business Analyst (BA)** và **Requirements Engineer**, đóng gói toàn bộ tri thức, nguyên tắc phản biện và kinh nghiệm thực chiến từ khóa học BA Chuyên Sâu của [VietnamCOS](https://pm.vietnamcos.com/courses/lesson/ki-n-th-c-c-b-n-ba-thu-th-p-y-u-c-u-hi-u-qu/ba-fundamentals-cac-loai-requirements) và tiêu chuẩn quốc tế **IIBA BABOK (Business Analysis Body of Knowledge)**.

---

## 🎯 Giá Trị Cốt Lõi Của Skill

Khi nhận yêu cầu từ sếp hoặc khách hàng như *"Làm cho website/app chạy nhanh hơn và có thanh toán online"*, một BA chưa có phương pháp sẽ vội vàng viết tài liệu tả nút bấm và màn hình, dẫn đến việc dev hiểu sai, hệ thống sập khi ra mắt, hoặc làm thừa tính năng gây lãng phí hàng trăm triệu đồng.

Skill này cung cấp bộ lọc tư duy sắc bén giúp:
1. **Tách bạch 4 tầng yêu cầu theo BABOK**:
   - **Business Requirements (BR)**: Mục tiêu kinh doanh, giá trị doanh thu/chi phí (Không bao giờ nhắc đến tính năng cụ thể).
   - **Stakeholder Requirements (SR)**: Nhu cầu của từng vai trò người dùng (Persona) cụ thể.
   - **Solution Requirements (SOR)**:
     - **Functional (FR)**: Hệ thống làm gì (Hành vi, xử lý dữ liệu).
     - **Non-Functional (NFR)**: Hệ thống làm tốt cỡ nào (Định lượng bằng số đo vật lý SMART: p95 latency, RPS, concurrent users, % uptime, Idempotency).
   - **Transition Requirements (TR)**: Năng lực chuyển tiếp tạm thời nhưng sống còn (Data Migration, Training nhân sự, Cutover & Rollback).
2. **Thiết lập Ma trận truy vết hai chiều (Bi-Directional Traceability Matrix - RTM)**:
   - Phát hiện và loại bỏ **Gold-Plating** (tính năng mạ vàng, làm thừa lãng phí tiền bạc).
   - Ngăn chặn **Orphaned Goals** (mục tiêu kinh doanh bị lãng quên, không có tính năng hỗ trợ).
3. **Phòng vệ rủi ro Go-Live**: Bịt kín các lỗ hổng về tải đồng thời và dữ liệu lịch sử trước khi bàn giao phần mềm.

---

## 📂 Cấu Trúc Thư Mục Skill

```
.agents/skills/ba-requirements-analyzer/
├── SKILL.md                          # Anchor rules, Boot sequence, Routing matrix, 5-Step Protocol
├── README.md                         # Tài liệu hướng dẫn sử dụng & Bài học thực tế
├── metadata.json                     # Metadata cấu hình trigger & progressive disclosure
├── knowledge/
│   ├── babok-requirements-taxonomy.md # Chi tiết 4 tầng phân loại & ranh giới phân định
│   ├── nfr-quantification-guide.md   # Sổ tay quy đổi tính từ cảm tính sang chỉ số đo lường SMART
│   ├── transition-requirements-radar.md # Radar kiểm soát Data Migration, Training và Rollback
│   └── traceability-and-anti-patterns.md # Hướng dẫn thiết lập RTM & nhận diện 6 Anti-patterns
├── templates/
│   ├── requirements-classification.template.md # Biểu mẫu bóc tách yêu cầu thô sang 4 tầng BABOK
│   ├── rtm-traceability-matrix.template.md      # Biểu mẫu ma trận truy vết yêu cầu 2 chiều
│   └── user-story-ac.template.md                # Biểu mẫu User Story chuẩn kèm Gherkin AC & NFR
└── loop/
    └── ba-requirements-checklist.md   # Cổng kiểm soát chất lượng (Quality Gatekeeper)
```

---

## 💡 3 Tình Huống Thực Chiến Điển Hình

### Tình huống 1: Sàn TMĐT ChợViệt muốn "Thanh toán nhanh hơn"
- **Yêu cầu ban đầu**: CEO chỉ đạo: *"Phải làm thanh toán nhanh hơn."*
- **Bóc tách chuẩn BABOK**:
  - `BR`: Giảm tỷ lệ bỏ giỏ hàng từ 68% xuống dưới 45% trong Q3, tăng doanh thu chuyển đổi 18%.
  - `SR`: Khách hàng đã đăng nhập cần hoàn tất đơn hàng mà không phải nhập lại thông tin địa chỉ & thẻ.
  - `FR`: Hệ thống tự động điền địa chỉ mặc định và hiển thị nút thanh toán 1-chạm cho khách lưu ví MoMo.
  - `NFR`: Luồng thanh toán hoàn tất tối đa 3 bước; trang xác nhận load dưới 1.5 giây ở p95 trên mạng 4G.
  - `TR`: Migrate dữ liệu phương thức thanh toán của 500.000 khách cũ sang chuẩn token mới trước Go-Live 48h.

### Tình huống 2: Ngân hàng số bỏ quên NFR
- **Sự cố**: Viết đầy đủ chức năng chuyển tiền, demo nội bộ rất mượt. Nhưng vào ngày 30 cuối tháng trả lương, 40.000 user truy cập cùng lúc khiến app treo, timeout và trừ tiền 2 lần.
- **Bài học**: NFR không thể ghi cảm tính "chạy nhanh, ổn định" mà phải có con số cụ thể: *chịu tải 40.000 concurrent users, latency API ≤ 200ms p95, và cơ chế Idempotency chống lặp giao dịch*.

### Tình huống 3: ERP đồ gỗ và thảm họa Transition Requirements
- **Sự cố**: 4 tháng làm FR/NFR rất bài bản, nhưng đến tuần Go-Live nhận ra dữ liệu 8 năm tồn kho từ phần mềm cũ lệch format không import được, và 30 nhân viên kế toán chưa được đào tạo. Dự án hoãn 6 tuần.
- **Bài học**: Transition Requirements là loại tạm thời nhưng sống còn. Phải hỏi ngay từ đầu: *Cần migrate dữ liệu gì? Cần đào tạo ai? Kịch bản chạy song song và rollback ra sao?*

---

## ☕ Lời Giải Bài Tập Thực Hành: Chuỗi Cà Phê CàPhêViệt (80 Chi Nhánh)

Bài tập phân loại 8 yêu cầu thô khi xây dựng ứng dụng đặt món và tích điểm:

| STT | Yêu Cầu Thô | Phân Loại Chuẩn | Giải Thích Bản Chất |
| :--- | :--- | :--- | :--- |
| 1 | *"Tăng số khách quay lại trong vòng 30 ngày thêm 25% trong năm 2026."* | **Business Requirement (BR)** | Mục tiêu kinh doanh định lượng cấp cao, trả lời câu hỏi "Tại sao làm app?". Không nhắc đến tính năng cụ thể. |
| 2 | *"Khách hàng cần đặt món trước và đến lấy không phải xếp hàng."* | **Stakeholder Requirement (SR)** | Nhu cầu của nhóm khách hàng (Buyer Persona) để giải quyết nỗi đau chờ đợi. |
| 3 | *"App cho phép thanh toán bằng MoMo và tích điểm tự động sau mỗi đơn."* | **Functional Requirement (FR)** | Hành vi cụ thể của hệ thống: [App/Hệ thống] + [cho phép thanh toán và tích điểm]. |
| 4 | *"App phải mở lên và sẵn sàng nhận đơn trong vòng 2 giây trên điện thoại tầm trung."* | **Non-Functional Requirement (NFR)** | Chỉ số chất lượng hiệu năng (Performance Latency ≤ 2s trên thiết bị trung cấp). |
| 5 | *"Cần chuyển dữ liệu 120.000 thành viên thẻ tích điểm giấy hiện tại sang app."* | **Transition Requirement (TR)** | Công việc chuyển dịch dữ liệu (Data Migration) tạm thời trước khi đưa hệ thống vào vận hành. |
| 6 | *"Nhân viên quầy cần xem danh sách đơn đặt trước theo thời gian để chuẩn bị."* | **Stakeholder Requirement (SR)** | Nhu cầu của nhóm nhân viên quầy (Store Staff Persona) để sắp xếp công việc. |
| 7 | *"Hệ thống phải đạt uptime 99,5% trong giờ cao điểm 7h–9h sáng."* | **Non-Functional Requirement (NFR)** | Chỉ số độ sẵn sàng (Availability SLA 99.5%) trong khung giờ cao điểm có thể đo kiểm được. |
| 8 | *"Cần đào tạo nhân viên 80 chi nhánh dùng màn hình nhận đơn mới trước khi ra mắt."* | **Transition Requirement (TR)** | Kế hoạch đào tạo người dùng nội bộ (Training & Change Management) tạm thời trước Go-live. |

---

## 🚀 Cách Sử Dụng Skill

Kích hoạt skill bất cứ khi nào bạn cần xử lý bài toán phân tích nghiệp vụ:
- *"Giúp mình phân loại danh sách yêu cầu sau theo chuẩn BABOK: [Dán danh sách yêu cầu]"*
- *"Bóc tách bài toán sau thành BR, SR, FR, NFR và TR: [Mô tả bài toán]"*
- *"Định lượng các NFR cảm tính sau thành chỉ số kỹ thuật kiểm thử được: [Danh sách NFR]"*
- *"Lập ma trận truy vết RTM và kiểm tra xem có tính năng nào bị gold-plating không cho dự án [X]"*
- *"Chuyển các yêu cầu nghiệp vụ này thành User Story chuẩn kèm Gherkin Acceptance Criteria"*
