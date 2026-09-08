# Phân Tầng Requirements Theo Chuẩn BABOK (Requirements Taxonomy)

Tài liệu hướng dẫn chi tiết về 4 tầng phân loại yêu cầu theo tiêu chuẩn **IIBA BABOK (Business Analysis Body of Knowledge)** kết hợp các bài học thực tiễn từ khóa đào tạo BA chuyên sâu của VietnamCOS.

---

## 1. Bản Đồ Tổng Quan 4 Tầng Requirements

```
                     ┌──────────────────────────────────────────────┐
                     │          BUSINESS REQUIREMENTS (BR)          │
                     │  Mục tiêu kinh doanh, giá trị chiến lược    │
                     │  "Tại sao chúng ta làm dự án này?"           │
                     └──────────────────────┬───────────────────────┘
                                            │ đẻ ra (drives)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │        STAKEHOLDER REQUIREMENTS (SR)         │
                     │  Nhu cầu của từng vai trò / nhóm người dùng │
                     │  "Ai cần gì để làm được việc của họ?"        │
                     └──────────────────────┬───────────────────────┘
                                            │ định hình (shapes)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │         SOLUTION REQUIREMENTS (SOR)          │
                     │  Đặc tính cụ thể của giải pháp/hệ thống     │
                     ├──────────────────────┬───────────────────────┤
                     │ Functional (FR)      │ Non-Functional (NFR)  │
                     │ Hệ thống LÀM GÌ      │ Hệ thống LÀM TỐT CỠ   │
                     │ (Hành vi, xử lý)     │ NÀO (Chỉ số đo lường) │
                     └──────────────────────┴───────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               │                                                         │
               ▼                                                         ▼
  ┌───────────────────────────┐                            ┌───────────────────────────┐
  │   TRANSITION REQ (TR)     │                            │    CÁC TÍNH NĂNG MỒ CÔI   │
  │ Yêu cầu chuyển tiếp:      │                            │  (Thiếu BR → Gold-plating │
  │ Migrate data, Đào tạo,    │                            │   Thiếu FR → Missing Goal)│
  │ Chạy song song (Tạm thời) │                            └───────────────────────────┘
  └───────────────────────────┘
```

---

## 2. Chi Tiết Từng Nhóm Requirements

### 2.1. Business Requirements (BR) — Yêu cầu nghiệp vụ
- **Bản chất**: Là tầng cao nhất, mô tả mục tiêu, tôn chỉ và kết quả kinh doanh định lượng mà tổ chức/doanh nghiệp muốn đạt được.
- **Câu hỏi dẫn dắt**: *"Tại sao chúng ta đầu tư thời gian và tiền bạc làm dự án/tính năng này?"*
- **Chủ sở hữu (Owner)**: BA kết hợp cùng Project Sponsor, Product Owner, Ban giám đốc khối (C-Level, VP, Head of Business).
- **Đặc điểm nhận diện**:
  - Số lượng ít (thường chỉ 3–7 mục tiêu lớn cho một release/dự án).
  - Ổn định theo thời gian, ít biến động theo kỹ thuật.
  - Là "ngọn hải đăng" để mọi yêu cầu cấp dưới (SR, FR, NFR) truy ngược về.
- **Quy tắc vàng (Golden Rule)**: **Tuyệt đối KHÔNG nhắc đến tính năng cụ thể hoặc công nghệ.**
  - ❌ *Sai lầm phổ biến*: "Hệ thống cần tích hợp cổng thanh toán MoMo và Apple Pay." *(Đây là giải pháp, không phải mục tiêu kinh doanh)*.
  - ✅ *Chuẩn xác*: "Giảm tỷ lệ bỏ giỏ hàng tại bước thanh toán từ 68% xuống dưới 45% trong Q3, qua đó thúc đẩy tăng trưởng doanh thu chuyển đổi thêm 18%."

---

### 2.2. Stakeholder Requirements (SR) — Yêu cầu của các bên liên quan
- **Bản chất**: Mô tả nhu cầu của một nhóm người dùng (Persona) hoặc vai trò cụ thể khi họ tương tác với hệ thống để hoàn thành nhiệm vụ của họ.
- **Câu hỏi dẫn dắt**: *"Người dùng / phòng ban này cần làm gì, thấy gì để hoàn thành công việc của họ?"*
- **Chủ sở hữu (Owner)**: BA xây dựng dựa trên kết quả Elicitation (phỏng vấn người dùng, workshop, khảo sát, quan sát hiện trường).
- **Đặc điểm nhận diện**:
  - Gắn liền với góc nhìn vai trò (Persona: Khách hàng mua sắm, Thu ngân quầy, Nhân viên CSKH, Quản lý kho, Kế toán).
  - Là cầu nối biến đổi mục tiêu kinh doanh trừu tượng thành nhu cầu thực tế của con người.
- **Ví dụ**:
  - *"Nhân viên chăm sóc khách hàng cần tra cứu toàn bộ lịch sử đơn hàng và khiếu nại của khách trong vòng 3 giây ngay khi nhận cuộc gọi."*
  - *"Quản lý kho cần nhận cảnh báo tức thời khi tồn kho của một mã SKU tụt xuống dưới ngưỡng an toàn để kịp thời đặt hàng NCC."*

---

### 2.3. Solution Requirements (SOR) — Yêu cầu giải pháp
Mô tả chi tiết những đặc tính, khả năng và tiêu chuẩn mà giải pháp phần mềm phải sở hữu để đáp ứng Stakeholder Requirements và Business Requirements. Gồm 2 nhánh rành mạch:

#### A. Functional Requirements (FR) — Yêu cầu chức năng
- **Bản chất**: Mô tả **Hệ thống làm gì** (System behavior, features, computations, data processing).
- **Câu hỏi dẫn dắt**: *"Hệ thống phải thực hiện những hành động, nghiệp vụ hay xử lý dữ liệu nào?"*
- **Công thức nhận diện nhanh**: Cú pháp `[Hệ thống] + [Động từ hành động] + [Tân ngữ] + [Điều kiện]`.
- **Ví dụ**:
  - *"Hệ thống tự động điền địa chỉ nhận hàng mặc định và phương thức thanh toán ưu tiên khi khách hàng đã đăng nhập vào màn hình checkout."*
  - *"Hệ thống gửi mã OTP qua SMS trong vòng 10 giây sau khi khách nhấn nút yêu cầu xác thực."*
  - *"Hệ thống cho phép nhân viên kế toán xuất báo cáo đối soát công nợ định dạng Excel theo từng chu kỳ 15 ngày."*

#### B. Non-Functional Requirements (NFR) — Yêu cầu phi chức năng
- **Bản chất**: Mô tả **Hệ thống làm tốt cỡ nào** (Chất lượng vận hành: tốc độ, tính sẵn sàng, độ an toàn, khả năng chịu tải, tính tương thích).
- **Câu hỏi dẫn dắt**: *"Hệ thống phải chịu được điều kiện môi trường khắc nghiệt nào? Phản hồi trong bao lâu? Bảo mật ra sao?"*
- **Quy tắc sống còn**: **Không chấp nhận tính từ cảm tính. Bắt buộc có con số kỹ thuật định lượng (SMART).**
  - ❌ *Sai lầm*: "App phải chạy mượt mà, giao diện thân thiện, chịu tải tốt vào ngày khuyến mãi."
  - ✅ *Chuẩn xác*:
    - *Performance*: "Thời gian tải trang thanh toán không vượt quá 1.5 giây ở p95 với kết nối 4G."
    - *Concurrency*: "Hệ thống xử lý ổn định 10.000 concurrent sessions mà không xảy ra lỗi 5xx."
    - *Reliability/Uptime*: "Đạt cam kết uptime 99.9% trong khung giờ cao điểm (7h00 - 22h00 hàng ngày)."
    - *Security*: "Toàn bộ thông tin thẻ thanh toán phải được token hóa qua chuẩn PCI-DSS Level 1, mật khẩu băm bằng Bcrypt với cost factor >= 12."

---

### 2.4. Transition Requirements (TR) — Yêu cầu chuyển tiếp
- **Bản chất**: Mô tả những năng lực, dữ liệu và bước chuẩn bị cần thiết để đưa tổ chức từ trạng thái hiện tại (As-Is) chuyển dịch an toàn sang trạng thái mới (To-Be).
- **Đặc tính độc nhất**: **Có tính chất TẠM THỜI (Transient).** Sau khi hệ thống mới Go-live và vận hành ổn định, Transition Requirements sẽ hoàn thành nhiệm vụ và biến mất.
- **Hệ quả nếu bỏ quên**: Hệ thống mới dù code tốt đến đâu cũng thất bại vì dữ liệu cũ không vào được, nhân viên không biết dùng, vận hành bị gián đoạn (Bài học ERP đồ gỗ sập vì 8 năm dữ liệu lệch format).
- **3 Trụ cột cốt lõi của Transition Requirements**:
  1. **Data Migration**: Làm sạch, ánh xạ dữ liệu (schema mapping), chuyển đổi dữ liệu lịch sử từ legacy database sang hệ thống mới.
  2. **Training & Change Management**: Huấn luyện người dùng cuối, viết SOP (Standard Operating Procedure), phân quyền chuyển tiếp.
  3. **Cutover Strategy & Parallel Run**: Kịch bản chạy song song 2 hệ thống (dual-run), thời điểm cắt chuyển chính thức (cutover window), và phương án khôi phục dữ liệu khi có sự cố (rollback plan).
- **Ví dụ**:
  - *"Cần migrate dữ liệu phương thức thanh toán và lịch sử giao dịch của 500.000 khách hàng hiện hữu sang định dạng token mới 48 giờ trước thời điểm go-live."*
  - *"Tổ chức đào tạo màn hình POS mới cho toàn bộ nhân viên quầy tại 80 chi nhánh trong vòng 2 tuần trước khi kích hoạt ứng dụng."*

---

## 3. Bảng Đối Chiếu Nhanh (Cheat Sheet Phân Loại)

| Tiêu Chí | Business Req (BR) | Stakeholder Req (SR) | Functional Req (FR) | Non-Functional Req (NFR) | Transition Req (TR) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trọng tâm** | Giá trị kinh doanh | Trải nghiệm người dùng | Hành vi hệ thống | Chất lượng vận hành | Chuyển đổi trạng thái |
| **Câu hỏi cốt lõi** | Tại sao làm? | Ai cần để làm gì? | Hệ thống làm gì? | Làm tốt cỡ nào? | Cần chuẩn bị gì để go-live? |
| **Từ khóa nhận diện**| Tăng doanh thu, giảm chi phí, chiếm thị phần | [Vai trò] cần có thể... để... | Hệ thống cho phép, lưu, tính toán, gửi... | Thời gian < X giây, Uptime > Y%, Z user | Migrate dữ liệu, Đào tạo, Chạy song song |
| **Chủ thể sở hữu** | Sponsor & Lead BA | Persona & BA | Tech Lead, Dev, QA, BA | Solution Architect, DevOps, QA | Data Team, Ops, Training, PM |
| **Vòng đời** | Suốt thời gian dự án | Suốt thời gian dự án | Vĩnh viễn (gắn với code) | Vĩnh viễn (gắn với hạ tầng) | **Tạm thời (Biến mất sau go-live)** |
