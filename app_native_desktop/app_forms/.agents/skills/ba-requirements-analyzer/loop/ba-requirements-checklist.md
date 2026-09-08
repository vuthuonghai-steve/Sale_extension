# Bảng Kiểm Duyệt Chất Lượng Requirements (Quality Gatekeeper Checklist)

Bảng kiểm duyệt bắt buộc phải thực thi trước khi bàn giao bất kỳ tài liệu phân tích nghiệp vụ nào (BRD, FRD, PRD, User Stories, RTM) cho Đội ngũ Phát triển (Dev), Kiểm thử (QA), hoặc Ban lãnh đạo (Sponsor).

---

## 1. Cổng Kiểm Tra 1: Phân Loại Chuẩn BABOK (Taxonomy Gate)

- [ ] **Business Requirements (BR)**:
  - [ ] BR chỉ tập trung vào mục tiêu kinh doanh, giá trị doanh thu, giảm chi phí hoặc thị phần.
  - [ ] **Quy tắc vàng**: Tuyệt đối **KHÔNG** chứa bất kỳ từ khóa nào về công nghệ hoặc tính năng cụ thể (nút bấm, API, MoMo, AI, Cloud...).
  - [ ] Có chỉ số KPI đo lường định lượng và thời hạn cụ thể (Q1, Q2, Năm...).

- [ ] **Stakeholder Requirements (SR)**:
  - [ ] Mọi SR đều gắn với một Persona hoặc vai trò người dùng cụ thể (Người mua, CSKH, Thu ngân, Kế toán).
  - [ ] Mô tả rõ họ cần tương tác gì với giải pháp để giải quyết nỗi đau trong công việc hàng ngày.
  - [ ] Truy ngược được trực tiếp về ít nhất một Business Requirement.

- [ ] **Functional Requirements (FR)**:
  - [ ] Tuân thủ cú pháp chuẩn: `[Hệ thống] + [Động từ hành động] + [Tân ngữ] + [Điều kiện]`.
  - [ ] Mô tả hành vi khách quan của hệ thống, không gộp chung với tiêu chí chất lượng (tách riêng NFR).
  - [ ] Có đầy đủ luồng thành công chính (Happy Path) và luồng xử lý ngoại lệ (Exception Path).

- [ ] **Non-Functional Requirements (NFR)**:
  - [ ] **Quy tắc sống còn**: Tuyệt đối **KHÔNG** dùng các tính từ cảm tính như "nhanh", "an toàn", "ổn định", "thân thiện".
  - [ ] 100% NFR đều có chỉ số kỹ thuật cụ thể (p95 latency ≤ X ms, Concurrent Users ≥ Y, Uptime SLA ≥ 99.9%, mã hóa Bcrypt/TLS 1.3).
  - [ ] Có phương pháp và công cụ kiểm thử rõ ràng để QA có thể viết kịch bản test (JMeter, k6, SonarQube, Lighthouse).

- [ ] **Transition Requirements (TR)**:
  - [ ] Đã trả lời rõ: Cần migrate dữ liệu cũ gì? Số lượng bao nhiêu bản ghi? Quy tắc làm sạch ra sao?
  - [ ] Đã xác định: Cần đào tạo những nhóm nhân sự nào? Bao nhiêu buổi? Tiêu chí UAT sign-off là gì?
  - [ ] Đã có kế hoạch: Chạy song song (Parallel run) hay Cutover trực tiếp? Kịch bản Rollback khi xảy ra sự cố nghiêm trọng là gì?

---

## 2. Cổng Kiểm Tra 2: Ma Trận Truy Vết 2 Chiều (Traceability Gate)

- [ ] **Chống Mục Tiêu Bị Bỏ Rơi (Orphaned Goals Check)**:
  - [ ] 100% Business Requirements đều có ít nhất một tập hợp FR/NFR và TR tương ứng để hiện thực hóa.
  - [ ] Không có mục tiêu chiến lược nào bị bỏ quên trên giấy.

- [ ] **Chống Mạ Vàng Tính Năng (Gold-Plating Check)**:
  - [ ] 100% Functional Requirements và User Stories đều truy ngược được về ít nhất một Business Requirement.
  - [ ] Đã loại bỏ triệt để các tính năng "thích thì làm" phát sinh tự phát không đem lại giá trị đo lường cho doanh nghiệp.

---

## 3. Cổng Kiểm Tra 3: Phòng Vệ Rủi Ro Kỹ Thuật (Defensive Probing Gate)

- [ ] **Cơ chế Idempotency**: Với mọi thao tác liên quan đến tiền bạc, thanh toán, trừ tồn kho, đã có quy định rõ về việc chống click đúp hoặc mạng lag gửi trùng request hay chưa?
- [ ] **Kịch bản Timeout & Mạng Chập Chờn**: Đã quy định rõ trạng thái hiển thị cho người dùng khi API bên thứ ba phản hồi chậm quá 10 giây hay chưa?
- [ ] **Dữ liệu mồ côi & Ngoại lệ**: Đã có quy định xử lý khi khách hàng hủy giữa chừng hoặc xóa ứng dụng trong lúc đang thanh toán hay chưa?

---

## 4. Đánh Giá & Xác Nhận Nghiệm Thu (Quality Verdict)

| Chỉ Số Chất Lượng | Kết Quả Đạt Được | Ngưỡng Yêu Cầu | Đánh Giá |
| :--- | :--- | :--- | :--- |
| **Độ phủ Traceability (RTM Coverage)** | [XX]% | 100% | Đạt / Cần bổ sung |
| **Tỷ lệ NFR Định lượng (SMART NFR)** | [YY]% | 100% (Không chấp nhận tính từ cảm tính) | Đạt / Cần sửa đổi |
| **Độ sẵn sàng chuyển tiếp (TR Readiness)** | [ZZ]% | Có Data Migration + Training + Rollback | Đạt / Cần bổ sung |

**Kết luận**: `[SẴN SÀNG BÀN GIAO CHO DEV & QA / CẦN HOÀN THIỆN LẠI CÁC MỤC ĐÁNH DẤU CHƯA ĐẠT]`
