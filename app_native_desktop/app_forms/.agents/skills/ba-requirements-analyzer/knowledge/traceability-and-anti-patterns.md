# Ma Trận Truy Vết & Nhận Diện Anti-Patterns (Traceability & Anti-Patterns)

Tài liệu chuyên sâu về cơ chế thiết lập **Requirements Traceability Matrix (RTM)** hai chiều và danh mục các lỗi tư duy (Anti-patterns) tai hại nhất mà BA thường mắc phải theo chuẩn IIBA BABOK và bài giảng VietnamCOS.

---

## 1. Ma Trận Truy Vết Hai Chiều (Bi-Directional Traceability)

Requirements không đứng độc lập mà liên kết chặt chẽ thành một chuỗi giá trị xuyên suốt từ chiến lược kinh doanh đến dòng mã nguồn phần mềm:

```
[Business Requirement] ◄════ (Top-down: Phục vụ mục tiêu gì?) ════► [Stakeholder Requirement]
                                                                              ▲
                                                                              ║ (Định hình)
                                                                              ▼
[Acceptance Criteria / Test] ◄══ (Bottom-up: Đo lường bằng gì?) ══► [Solution Requirements]
                                                                     ├─ Functional (FR)
                                                                     ├─ Non-Functional (NFR)
                                                                     └─ Transition (TR)
```

### 1.1. Kiểm Tra Top-Down (Từ Trên Xuống): Chống "Mục Tiêu Bị Bỏ Rơi" (Orphaned Goals)
- **Mục đích**: Đảm bảo mọi mục tiêu kinh doanh của doanh nghiệp đều có tính năng và giải pháp cụ thể để hiện thực hóa.
- **Dấu hiệu cảnh báo**: Một Business Requirement (BR) tồn tại trong tài liệu BRD/PRD nhưng khi đối chiếu sang RTM lại không có bất kỳ Functional Requirement (FR) hoặc NFR nào liên kết.
- **Hậu quả**: Ban giám đốc kỳ vọng tăng trưởng 20% doanh thu nhưng đội ngũ kỹ thuật không build bất kỳ tính năng nào đóng góp trực tiếp vào mục tiêu này.

### 1.2. Kiểm Tra Bottom-Up (Từ Dưới Lên): Chống "Mạ Vàng Tính Năng" (Gold-Plating)
- **Mục đích**: Đảm bảo mọi tính năng được lập trình đều giải quyết nhu cầu thực tế và phục vụ một mục tiêu kinh doanh rõ ràng.
- **Dấu hiệu cảnh báo**: Một Functional Requirement (FR) được đề xuất (thường do sở thích cá nhân của stakeholder hoặc ý tưởng công nghệ mới của dev) nhưng không thể liên kết ngược về bất kỳ Business Requirement (BR) nào.
- **Hậu quả**: Lãng phí ngân sách kỹ thuật, phình to phạm vi (Scope Creep), làm phức tạp hệ thống mà không tạo ra đồng doanh thu hay giá trị thực tế nào.

---

## 2. Danh Mục 6 Anti-Patterns Điển Hình Của BA

### Anti-Pattern 1: Nhầm Lẫn Mục Tiêu Kinh Doanh Với Tính Năng Kỹ Thuật (Solution as Goal)
- **Biểu hiện**: Viết mục tiêu dự án là: *"Xây dựng tính năng thanh toán MoMo và Apple Pay"* hoặc *"Tích hợp hệ sinh thái AI Chatbot"*.
- **Bản chất sai lầm**: MoMo, Apple Pay hay AI chỉ là **Giải pháp (Solution)**, không phải **Mục tiêu kinh doanh (Business Requirement)**.
- **Cách khắc phục**: Luôn đặt câu hỏi *"Làm điều đó để đạt được giá trị gì?"*
  - *"Để khách hàng thanh toán nhanh hơn và giảm tỷ lệ thoát trang."*
  - → **BR chuẩn**: *"Giảm tỷ lệ bỏ giỏ hàng tại bước checkout từ 68% xuống dưới 45% trong Q3, thúc đẩy tăng trưởng doanh thu 18%."*

### Anti-Pattern 2: Điểm Mù Phi Chức Năng (NFR Blindspot)
- **Biểu hiện**: Tài liệu dài 50 trang mô tả chi tiết hàng trăm màn hình, form nhập liệu, luồng click, nhưng phần NFR chỉ có 1 trang sao chép từ dự án cũ với các từ ngữ sáo rỗng: "Hệ thống bảo mật, ổn định, thân thiện".
- **Hậu quả**: Hệ thống sập vào ngày ra mắt (Sự cố ứng dụng ngân hàng số nghẽn mạng ngày trả lương).
- **Cách khắc phục**: Với mỗi FR trọng yếu, BA phải bắt buộc hoàn thành 4 câu hỏi đào sâu về: Tốc độ p95, Tải cực đại (concurrency), Dự phòng thảm họa (HA/Failover), và Idempotency (chống lặp giao dịch).

### Anti-Pattern 3: Bỏ Quên Yêu Cầu Chuyển Tiếp Cho Đến Tuần Go-Live (TR Neglect)
- **Biểu hiện**: Coi Transition Requirements là việc phụ của IT Operations nên không đưa vào phạm vi phân tích requirements ngay từ đầu.
- **Hậu quả**: Đến ngày chuyển giao dữ liệu thì nhận ra database cũ chứa dữ liệu không có cấu trúc suốt 8 năm, hoặc nhân viên tại quầy không được đào tạo dẫn đến gián đoạn kinh doanh (Khủng hoảng ERP đồ gỗ).
- **Cách khắc phục**: Thiết lập Transition Plan Matrix ngay từ giai đoạn Requirement Elicitation, phân định rõ chủ sở hữu và tiêu chí nghiệm thu cho Data Migration, Training và Cutover Rollback.

### Anti-Pattern 4: Yêu Cầu Cảm Tính Không Thể Kiểm Thử (Unverifiable Requirements)
- **Biểu hiện**: Viết yêu cầu dạng: *"Hệ thống phải load cực kỳ mượt mà trên mọi thiết bị"* hoặc *"Giao diện phải hiện đại, bắt mắt"*.
- **Hậu quả**: Tranh cãi không có hồi kết giữa Tester, Developer, Designer và Client khi nghiệm thu (UAT Acceptance).
- **Cách khắc phục**: Ép sang số liệu định lượng kiểm thử được: *"Giao diện đạt điểm hiệu năng tối thiểu 85/100 trên Google PageSpeed Insights; thời gian tương tác FCP dưới 1.2 giây trên mạng 4G."*

### Anti-Pattern 5: Bẫy "Yes-Man" Với Stakeholder (Unfiltered Requirements Ingestion)
- **Biểu hiện**: Stakeholder nói gì ghi nấy, biến tài liệu BA thành bản ghi chép danh sách điều ước (Wishlist) mà không qua bộ lọc tư duy BABOK.
- **Hậu quả**: Tài liệu ngập tràn các tính năng mâu thuẫn lẫn nhau và vượt quá ngân sách dự án.
- **Cách khắc phục**: Sử dụng quy trình bóc tách 5 bước: Gom yêu cầu thô -> Hỏi "Tại sao?" (BR) -> Hỏi "Ai cần và để làm gì?" (SR) -> Tách FR vs NFR -> Xác lập Traceability.

### Anti-Pattern 6: Tài Liệu Tĩnh Không Đồng Bộ (Stale Requirements Documentation)
- **Biểu hiện**: Khi phạm vi thay đổi trong quá trình dev (Change Request), BA chỉ trao đổi miệng trên Slack/Jira mà không cập nhật lại RTM và tài liệu đặc tả.
- **Hậu quả**: Khi kiểm thử UAT hoặc bàn giao khách hàng, tài liệu nói một đằng, hệ thống chạy một nẻo.
- **Cách khắc phục**: Mọi thay đổi về phạm vi phải kích hoạt quy trình Baseline & Change Control, cập nhật trực tiếp vào Ma trận truy vết RTM.
