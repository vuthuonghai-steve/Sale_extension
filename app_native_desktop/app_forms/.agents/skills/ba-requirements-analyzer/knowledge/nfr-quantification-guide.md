# Cẩm Nang Định Lượng NFR (Non-Functional Requirements Quantification Guide)

> *"Functional Requirements quyết định hệ thống LÀM ĐƯỢC GÌ, nhưng chính Non-Functional Requirements quyết định hệ thống CÓ SỐNG SÓT NGOÀI THỰC ĐỊA HAY KHÔNG."*
> — Trích bài học BA Fundamentals, VietnamCOS.

---

## 1. Bản Án Của NFR Cảm Tính (Vague NFR Failure)

### Bài học thực tế: Ngân hàng số sập nghẽn ngày trả lương
Một ứng dụng ngân hàng số tại TP.HCM triển khai tính năng chuyển khoản liên ngân hàng 24/7 và quét VietQR. Các tài liệu BA viết đầy đủ chức năng và demo trơn tru. Tuy nhiên, NFR chỉ ghi chung chung: *"Hệ thống phải xử lý giao dịch nhanh chóng và chịu tải ổn định."*
- **Hậu quả**: Vào ngày 30 cuối tháng (dịp trả lương), 40.000 người dùng truy cập đồng thời. Hệ thống sập, giao dịch bị timeout, mạng nghẽn khiến nhiều khách hàng bấm liên tiếp và bị trừ tiền 2 lần do thiếu cơ chế Idempotency.
- **Nguyên nhân**: Đội ngũ Tester không thể test tải vì không có con số cụ thể để cấu hình kịch bản JMeter/k6. Lỗi thuộc về BA khi không đưa ra chỉ số định lượng.

---

## 2. Tiêu Chí SMART Trong Định Lượng NFR

Mọi NFR do BA định nghĩa bắt buộc phải tuân theo chuẩn **SMART**:
- **S (Specific)**: Xác định rõ ngữ cảnh, giao diện hoặc API cụ thể (ví dụ: API thanh toán checkout, không nói chung chung cả hệ thống).
- **M (Measurable)**: Có con số đo lường vật lý (giây, mili-giây, RPS, %, số người dùng đồng thời).
- **A (Achievable)**: Khả thi về mặt ngân sách hạ tầng và kiến trúc kỹ thuật.
- **R (Relevant)**: Đóng góp trực tiếp vào mục tiêu kinh doanh (BR) tương ứng.
- **T (Time-bound / Threshold)**: Có phân vị thống kê cụ thể (p90, p95, p99) và khung thời gian giám sát.

---

## 3. Bảng Chuyển Đổi Tính Từ Cảm Tính Sang Chỉ Số Đo Lường Kỹ Thuật

| Tính từ cảm tính (CẤM DÙNG) | Nguy cơ tiềm ẩn | Chuẩn hóa kỹ thuật định lượng (BẮT BUỘC) | Công cụ & Phương pháp đo |
| :--- | :--- | :--- | :--- |
| *"Hệ thống phải chạy nhanh"* | Dev tối ưu điểm vô ích, QA không biết bao nhiêu là đạt | - Thời gian phản hồi API (Latency) ≤ 200ms ở p95.<br>- Tải trang (FCP/LCP) ≤ 1.5s trên đường truyền 4G.<br>- Thời gian từ khi bấm nút đến khi hiển thị kết quả ≤ 2s. | APM (Datadog, Prometheus, New Relic), Lighthouse |
| *"Chịu tải tốt ngày khuyến mãi"* | Server sập nghẽn khi có flash sale | - Chịu tải đồng thời tối thiểu **15.000 concurrent users**.<br>- Thông lượng tối thiểu **1.200 TPS (Transactions/giây)**.<br>- Tỷ lệ lỗi 5xx < 0.01% ở ngưỡng tải cực đại (peak load). | Stress testing bằng k6, Locust, JMeter |
| *"Hệ thống phải an toàn, bảo mật"* | Rò rỉ dữ liệu, bị tấn công SQLi, XSS, lộ thẻ | - Mật khẩu băm bằng **Bcrypt (cost factor ≥ 12)** hoặc Argon2id.<br>- Toàn bộ traffic bắt buộc mã hóa qua **TLS 1.3**.<br>- Tuân thủ chuẩn bảo mật **PCI-DSS Level 1** (với dữ liệu thanh toán) và **OWASP Top 10**.<br>- Khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp trong 10 phút. | SAST/DAST (SonarQube, OWASP ZAP), Penetration Testing |
| *"Hệ thống phải luôn luôn hoạt động"* | Không có cam kết SLA, tranh cãi chi phí hạ tầng | - Độ sẵn sàng (Uptime SLA): **99.9%** hàng tháng (tối đa ~43.8 phút downtime/tháng).<br>- Khung giờ cao điểm (7h - 22h): Uptime **99.95%**.<br>- RTO (Recovery Time Objective) ≤ 15 phút.<br>- RPO (Recovery Point Objective) ≤ 5 phút (tối đa mất 5 phút dữ liệu). | Uptime Robot, Cloud Monitoring, Disaster Recovery drill |
| *"Giao diện thân thiện, dễ dùng"* | Tranh luận chủ quan về thẩm mỹ | - Người dùng mới hoàn tất flow mua hàng trong **tối đa 3 bước / dưới 60 giây** mà không cần trợ giúp.<br>- Tỷ lệ hoàn thành tác vụ (Task Completion Rate) ≥ 90% trong User Testing (10 mẫu ngẫu nhiên).<br>- Tương thích chuẩn tiếp cận **WCAG 2.1 Level AA** (độ tương phản màu ≥ 4.5:1). | Usability Testing, Hotjar, Google Analytics |
| *"Tránh trừ tiền 2 lần khi mạng lag"* | Sai lệch tài chính, tranh chấp pháp lý | - Cơ chế **Idempotency**: Mọi request thanh toán gửi trùng `idempotency_key` trong vòng 120 giây phải trả về cùng kết quả của giao dịch đầu tiên mà không tạo bản ghi trừ tiền thứ hai. | Automated API Integration Test, Chaos Testing |

---

## 4. Bốn Câu Hỏi "Truy Vấn Ngược" (Reverse Probing) Khơi Gợi NFR Ẩn

Khi Stakeholder đưa ra bất kỳ Functional Requirement nào (ví dụ: "Cho phép khách hàng chuyển tiền"), BA phải ngay lập tức kích hoạt bộ 4 câu hỏi đào sâu:

1. **Về Tốc độ (Speed)**: *"Trong trường hợp mạng 3G/4G chập chờn, sau khi bấm nút bao nhiêu giây thì người dùng được phép coi là lỗi/timeout?"*
2. **Về Tải (Capacity & Concurrency)**: *"Vào thời điểm cao điểm nhất trong tháng/năm (ví dụ: ngày nhận lương, flash sale 11/11), có bao nhiêu giao dịch diễn ra trong 1 phút?"*
3. **Về Rủi ro & An ninh (Security & Fault Tolerance)**: *"Nếu ngân hàng đối tác hoặc cổng thanh toán bị treo trong 30 giây, hệ thống của chúng ta sẽ hiển thị trạng thái gì và bảo vệ số dư của khách thế nào?"*
4. **Về Tính sẵn sàng (Availability & Disaster Recovery)**: *"Nếu toàn bộ Data Center gặp sự cố mất điện, doanh nghiệp chấp nhận mất dữ liệu trong bao nhiêu phút gần nhất (RPO) và hệ thống phải bật lại sau bao lâu (RTO)?"*
