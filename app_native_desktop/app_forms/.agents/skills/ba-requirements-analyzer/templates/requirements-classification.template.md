# Biểu Mẫu Bóc Tách & Phân Loại Requirements Chuẩn BABOK (Skeleton Outline)

**Dự án**: [Tên Dự Án]  
**Lead BA**: [Họ và Tên BA / Agent]  
**Phiên bản**: [1.0.0] | **Ngày lập**: [YYYY-MM-DD]  
**Tài liệu nguồn / Elicitation Session**: [Tham chiếu nguồn yêu cầu hoặc biên bản khảo sát]

---

## 1. Tóm Tắt Ngữ Cảnh & Không Gian Bài Toán (Problem Domain & Context)
- **Vấn đề cốt lõi (Problem Statement)**: [Mô tả thực trạng, điểm nghẽn hoặc tổn thất hiện tại]
- **Tầm nhìn giải pháp (Solution Vision)**: [Mục tiêu tổng quát và định hướng can thiệp]
- **Negative Space (Ranh giới cấm kỵ)**:
  - *CẤM 1*: [Hành vi hoặc giải pháp hệ thống tuyệt đối không được làm]
  - *CẤM 2*: [Ranh giới vi phạm nghiêm trọng]
  - *CẤM 3*: [Ràng buộc kiến trúc không thể xâm phạm]

---

## 2. Bảng Bóc Tách Yêu Cầu Thô Sang 4 Tầng BABOK (Classification Table)

| Yêu Cầu Thô Ban Đầu (Raw Input) | Tầng BABOK | Mã Định Danh | Nội Dung Đặc Tả Đã Chuẩn Hóa | Chủ Thể / Persona | Cơ Chế Đo Lường / KPI / NFR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Mô tả thô từ stakeholder 1] | **BR** | **BR-01** | [Mục tiêu kinh doanh thuần túy, KHÔNG chứa công nghệ/tính năng, có KPI số] | Sponsor / Executive | [Chỉ số % hoặc doanh thu/chi phí] |
| [Mô tả thô từ stakeholder 2] | **SR** | **SR-01** | [Nhu cầu công việc của persona, giải quyết nỗi đau thao tác] | [Persona cụ thể] | [Thời gian thao tác / Tần suất] |
| [Mô tả thô từ stakeholder 3] | **FR** | **FR-01** | [Hệ thống + Động từ hành động + Tân ngữ + Điều kiện] | [Module / Thành phần] | [Kết quả trả về chính xác] |
| [Mô tả thô từ stakeholder 4] | **NFR** | **NFR-01** | [Chỉ số kỹ thuật định lượng SMART: latency, throughput, SLA, security] | DevOps / Architect / QA | [Chỉ số vật lý & công cụ test] |
| [Mô tả thô từ stakeholder 5] | **TR** | **TR-01** | [Yêu cầu chuyển tiếp: Migration dữ liệu, đào tạo nhân sự, rollback] | Data / Ops / BA | [Tiêu chuẩn UAT & Sign-off] |

---

## 3. Đặc Tả Chi Tiết Từng Nhóm Requirements

### 3.1. Business Requirements (BR) — Mục Tiêu Nghiệp Vụ
- **[BR-XX] [Tên Mục Tiêu Chiến Lược]**:
  - *Mô tả mục tiêu*: [Mục tiêu tăng trưởng, tối ưu chi phí hoặc tuân thủ pháp lý]
  - *KPI đo lường thành công*: [Chỉ số SMART: con số cụ thể, mốc thời gian rõ ràng]
  - *Thời hạn kỳ vọng*: [Q1/Q2/Năm]
  - *Product Sponsor*: [Vai trò người bảo trợ kinh doanh]

### 3.2. Stakeholder Requirements (SR) — Nhu Cầu Bên Liên Quan
- **[SR-XX] [Nhu Cầu Của Persona]**:
  - *Là một*: [Vai trò người dùng / Persona rõ ràng]
  - *Tôi cần*: [Nhu cầu tương tác hoặc giải quyết điểm nghẽn quy trình]
  - *Để mà*: [Giá trị nghiệp vụ trực tiếp mang lại cho công việc hàng ngày]
  - *Liên kết Business Requirement*: [Mã BR-XX]

### 3.3. Solution Requirements — Functional (FR) — Yêu Cầu Chức Năng
- **[FR-XX] [Tên Tính Năng / Hành Vi Hệ Thống]**:
  - *Quy tắc nghiệp vụ*: [Cú pháp: Hệ thống + Động từ hành động + Tân ngữ + Ràng buộc điều kiện]
  - *Luồng chính (Happy Path)*:
    1. [Bước khởi tạo / Nhận input]
    2. [Bước xử lý nghiệp vụ trung gian]
    3. [Bước trả kết quả / Cập nhật trạng thái]
  - *Luồng ngoại lệ (Alternative & Exception Flow)*:
    - [Trường hợp lỗi/timeout/dữ liệu không hợp lệ: Xử lý và ghi log thế nào]
  - *Liên kết Stakeholder Requirement*: [Mã SR-XX]

### 3.4. Solution Requirements — Non-Functional (NFR) — Yêu Cầu Phi Chức Năng
- **[NFR-XX] [Nhóm: Performance / Reliability / Security / Scalability / Maintainability]**:
  - *Chỉ số kỹ thuật định lượng (SMART Metric)*: [p95 latency ≤ X ms, RPS ≥ Y, Uptime SLA ≥ Z%, Chuẩn mã hóa]
  - *Tiêu chuẩn tuân thủ*: [Tiêu chuẩn kỹ thuật áp dụng]
  - *Phương pháp kiểm thử nghiệm thu (Verification Method)*: [Công cụ benchmark hoặc test script cụ thể]

### 3.5. Transition Requirements (TR) — Yêu Cầu Chuyển Tiếp Tạm Thời
- **[TR-XX] [Nhóm: Data Migration / Operations Training / Cutover & Rollback]**:
  - *Nội dung thực hiện*: [Hành động chuẩn bị trước hoặc trong quá trình chuyển giao]
  - *Thời điểm thực thi*: [Mốc thời gian trước Go-Live hoặc giai đoạn Hypercare]
  - *Tiêu chí nghiệm thu (Sign-off Criteria)*: [Điều kiện tiên quyết để hoàn tất chuyển tiếp]
