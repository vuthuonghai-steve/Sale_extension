# Ví Dụ Mẫu Tham Chiếu: Quy Trình Phân Tích Nghiệp Vụ Thanh Toán E-Commerce (Worked Example)

> **Mục đích tài liệu**: Cung cấp case-study tham chiếu hoàn chỉnh cho BA khi thực thi phân tích nghiệp vụ theo chuẩn IIBA BABOK. Tài liệu này nằm ở tầng Tier 4 (On-Demand Reference) và không nạp vào context trừ khi có yêu cầu cụ thể.

---

## 1. Ví Dụ Bóc Tách 4 Tầng BABOK (E-Commerce Checkout)

| Yêu Cầu Thô Ban Đầu | Tầng BABOK | Mã Định Danh | Nội Dung Đặc Tả Đã Chuẩn Hóa | Chủ Thể / Persona | Cơ Chế Đo Lường & NFR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| "Làm thanh toán nhanh hơn" | **BR** | **BR-01** | Giảm tỷ lệ bỏ giỏ hàng ở bước checkout từ 68% xuống dưới 45% trong Q3, tăng doanh thu 18%. | Sponsor / Ban Giám Đốc | Google Analytics Ecommerce Funnel |
| "Khách không muốn gõ lại địa chỉ" | **SR** | **SR-01** | Khách hàng thân thiết có khả năng hoàn tất đơn hàng mà không phải nhập lại địa chỉ và phương thức thanh toán. | Buyer Persona (Khách mua hàng) | Thời gian hoàn tất checkout < 45s |
| "Tự điền thông tin và nút 1-chạm" | **FR** | **FR-01** | Hệ thống tự động điền địa chỉ mặc định và hiển thị nút thanh toán 1-chạm qua ví điện tử liên kết. | Hệ thống Frontend + Payment Service | Tuân thủ cú pháp: Hệ thống + Động từ + Tân ngữ |
| "Trang thanh toán phải load mượt" | **NFR** | **NFR-01** | Thời gian phản hồi API checkout p95 ≤ 800ms; luồng thanh toán hoàn tất tối đa 3 bước; SLA uptime 99.9%. | DevOps / QA | k6 load test, Lighthouse performance score ≥ 90 |
| "Khách cũ dùng ví MoMo thế nào?" | **TR** | **TR-01** | Migrate toàn bộ 500.000 token ví khách hàng cũ sang cơ chế mã hóa PCI-DSS mới trước Go-Live 48 giờ. | Data Engineer / Ops | Đối soát 100% token hash, rollback plan sẵn sàng |

---

## 2. Ví Dụ Ma Trận Truy Vết RTM (Requirements Traceability Matrix)

| Business Req (BR) | Stakeholder Req (SR) | Functional Req (FR) | Non-Functional Req (NFR) | Transition Req (TR) | Test Case / UAT ID | Trạng Thái | Kiểm Định Gold-Plating / Orphaned Goal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BR-01**: Tăng chuyển đổi checkout 18% | **SR-01**: Checkout 1-chạm không gõ lại địa chỉ | **FR-01**: Tự điền địa chỉ & nút 1-chạm | **NFR-01**: p95 ≤ 800ms, SLA 99.9% | **TR-01**: Migrate 500k token khách cũ | **TC-PAY-01**, **TC-PERF-01** | In Progress | ✅ Hợp lệ (Đầy đủ chuỗi từ BR đến Test) |
| **BR-02**: Giảm 30% thời gian xử lý khiếu nại | **SR-02**: CSKH xem lịch sử khách trong 3s | **FR-02**: Dashboard 360 độ tra cứu ticket | **NFR-02**: API tra cứu ≤ 300ms | **TR-02**: Đào tạo 50 CSKH trước T-7 ngày | **TC-CS-01**, **TC-PERF-02** | Ready for Dev | ✅ Hợp lệ (Gắn kết mục tiêu vận hành) |
| *[Mục tiêu bị bỏ rơi?]* **BR-03**: Tiếp cận khách Gen Z | *Chưa có SR* | *Chưa có FR* | *Chưa có NFR* | *Chưa có TR* | *Chưa có TC* | **CẢNH BÁO** | ⚠️ **ORPHANED GOAL**: Mục tiêu chưa có tính năng hỗ trợ! |
| *Không có BR nào* | *Không có SR nào* | **FR-09**: Trợ lý ảo 3D nhận diện giọng nói | *NFR-09*: Nhận diện giọng nói ≤ 1s | *Chưa rõ* | **TC-AI-01** | Blocked | 🚫 **GOLD-PLATING**: Tính năng tự phát, không có BR hỗ trợ! |

---

## 3. Ví Dụ User Story & Gherkin Acceptance Criteria

### User Story: `[US-PAY-01]` Thanh toán 1-chạm qua ví điện tử
- **Phục vụ**: `BR-01` ➔ `SR-01` ➔ Hiện thực hóa `FR-01` & `NFR-01`
- **Là một**: Khách hàng thân thiết đã liên kết ví điện tử
- **Tôi muốn**: Bấm nút thanh toán 1-chạm ngay tại giỏ hàng
- **Để mà**: Hoàn tất đơn hàng ngay lập tức mà không phải qua nhiều bước xác nhận rườm rà

#### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Khách hàng thanh toán thành công qua ví điện tử liên kết
  Given Khách hàng đã đăng nhập tài khoản và có số dư ví tối thiểu 50.000 VNĐ
    And Đã lưu địa chỉ nhận hàng mặc định trong hồ sơ
   When Khách hàng bấm nút "Thanh toán 1-chạm" tại màn hình giỏ hàng
   Then Hệ thống hoàn tất giao dịch và chuyển sang màn hình "Xác nhận đơn hàng" trong vòng dưới 800ms
    And Gửi email hóa đơn điện tử kèm mã đơn hàng trong vòng 30 giây
    And Tự động cộng điểm tích lũy vào tài khoản khách hàng

Scenario: Xử lý khi cổng thanh toán đối tác bị timeout hoặc mạng gián đoạn
  Given Khách hàng vừa bấm xác nhận thanh toán
   When Cổng thanh toán đối tác không phản hồi sau 10 giây
   Then Hệ thống tự động kích hoạt cơ chế Idempotency kiểm tra trạng thái giao dịch
    And KHÔNG được trừ tiền hai lần hoặc tạo đơn hàng trùng lặp
    And Hiển thị thông báo: "Giao dịch đang được xử lý an toàn. Vui lòng chờ cập nhật trong 1 phút."
```
