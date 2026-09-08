# Radar Kiểm Soát Yêu Cầu Chuyển Tiếp (Transition Requirements Radar)

> *"Transition Requirements có tuổi thọ tạm thời và sẽ biến mất sau go-live, nhưng nếu bỏ quên chúng thì hệ thống dù được lập trình hoàn hảo 100% cũng không bao giờ có thể đưa vào vận hành thực tế."*
> — Trích bài học BA Fundamentals, VietnamCOS.

---

## 1. Bài Học Xương Máu: Khủng Hoảng Go-Live ERP Đồ Gỗ

### Tình huống thực tế:
Một doanh nghiệp sản xuất đồ gỗ xuất khẩu quy mô lớn tại Bình Dương đầu tư hàng tỷ đồng để thay thế phần mềm kế toán cũ bằng hệ thống ERP toàn diện.
- Đội ngũ BA và kỹ thuật đã dành 4 tháng làm việc rất bài bản để hoàn thiện hàng trăm trang tài liệu Functional và Non-Functional Requirements.
- **Tuần Go-Live**: Khủng hoảng nổ ra khi:
  1. Dữ liệu công nợ và tồn kho tích lũy suốt 8 năm từ hệ thống cũ bị sai lệch định dạng, không thể import vào ERP mới.
  2. 30 nhân viên kế toán và thủ kho chưa từng được đào tạo giao diện mới, hoàn toàn bối rối không biết tạo phiếu nhập xuất ở đâu.
  3. Không có cơ chế đối chiếu song song giữa hệ thống cũ và mới.
- **Hậu quả**: Dự án bị đình chỉ Go-live 6 tuần; công ty phải huy động nhân sự nhập liệu thủ công bằng Excel, phát sinh chi phí phạt chậm giao hàng cho đối tác quốc tế.

---

## 2. Bản Đồ 3 Trụ Cột Transition Requirements (TR)

```
                       ┌──────────────────────────────────────────────┐
                       │     TRANSITION REQUIREMENTS RADAR (TR)       │
                       └──────────────────────┬───────────────────────┘
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
┌──────────────────┐                ┌──────────────────┐                ┌──────────────────┐
│  DATA MIGRATION  │                │     TRAINING     │                │     CUTOVER      │
│  (Dữ liệu cũ)    │                │  (Con người)     │                │   (Vận hành)     │
├──────────────────┤                ├──────────────────┤                ├──────────────────┤
│• Schema Mapping  │                │• Kế hoạch đào tạo│                │• Chạy song song  │
│• Data Cleansing  │                │• Tài liệu SOP/HD │                │  (Parallel Run)  │
│• Lịch sử giao    │                │• Phân quyền tạm  │                │• Cửa sổ Cutover  │
│  dịch cần giữ    │                │  thời & thử việc │  (Downtime window)│
│• Tiêu chí nghiệm │                │• Hỗ trợ On-site  │                │• Kịch bản phục   │
│  thu dữ liệu     │                │  (Floor walking) │  hồi (Rollback)  │
└──────────────────┘                └──────────────────┘                └──────────────────┘
```

---

## 3. Radar 7 Câu Hỏi Khai Thác TR Ngay Từ Giai Đoạn Elicitation

Để không rơi vào cái bẫy "nước đến chân mới nhảy" sát ngày Go-live, BA phải đưa 7 câu hỏi sau vào checklist phỏng vấn ngay từ Sprint đầu tiên:

### Trụ cột 1: Dữ liệu (Data Migration)
1. **Phạm vi dữ liệu cũ**: *"Hệ thống hiện tại đang lưu trữ bao nhiêu năm dữ liệu? Có bao nhiêu bản ghi khách hàng/đơn hàng/tồn kho cần chuyển sang hệ thống mới?"*
2. **Tiêu chuẩn làm sạch (Cleansing)**: *"Dữ liệu rác (khách hàng trùng SĐT, địa chỉ thiếu quận/huyện, sản phẩm đã ngừng kinh doanh 5 năm trước) sẽ được lọc bỏ theo quy tắc nào trước khi chuyển đổi?"*
3. **Ánh xạ cấu trúc (Schema Mapping)**: *"Cấu trúc dữ liệu cũ có trường nào không tương thích với mô hình dữ liệu mới hay không? (Ví dụ: ID khách hàng cũ dạng chuỗi số 8 ký tự, hệ thống mới dùng UUID v4)?"*

### Trụ cột 2: Con người (Training & Change Management)
4. **Đối tượng thụ hưởng**: *"Có bao nhiêu nhóm người dùng nội bộ (kế toán, thu ngân, kho, CSKH) cần được đào tạo lại quy trình trước ngày Go-live?"*
5. **Hình thức & Thời lượng**: *"Họ cần được đào tạo qua hình thức nào (Workshop trực tiếp, video tự học, tài liệu cầm tay Cheat-sheet)? Cần tối thiểu bao nhiêu buổi thực hành trên môi trường Staging/UAT?"*
6. **Tiêu chí sẵn sàng (Readiness Gate)**: *"Bài kiểm tra đánh giá năng lực người dùng cuối (UAT Sign-off) cần đạt tỷ lệ bao nhiêu % trước khi cấp quyền trên môi trường Production?"*

### Trụ cột 3: Chuyển đổi vận hành (Cutover & Rollback)
7. **Kịch bản chuyển giao**: *"Hệ thống cũ và mới có cần chạy song song (Parallel Run) trong 2–4 tuần để đối soát số liệu không? Nếu đêm Go-live xảy ra sự cố nghiêm trọng không thể khắc phục trong 2 tiếng, kế hoạch Rollback quay lại hệ thống cũ diễn ra như thế nào để không làm gián đoạn kinh doanh sáng hôm sau?"*

---

## 4. Bảng Kế Hoạch Chuyển Tiếp Mẫu (Transition Plan Matrix)

Khi xây dựng tài liệu chuyển tiếp, BA sử dụng bảng biểu chuẩn sau:

| Mã TR | Hạng Mục Chuyển Tiếp | Chi Tiết Thực Hiện | Thời Điểm Hoàn Thành | Người Chịu Trách Nhiệm | Tiêu Chí Nghiệm Thu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TR-01** | Data Migration | Chuyển đổi dữ liệu 120.000 thành viên tích điểm từ Excel/thẻ giấy sang Database hệ thống mới. | T-7 ngày trước Go-Live | Data Engineer + BA | Khớp 100% tổng số dư điểm và số điện thoại định dạng chuẩn E.164. |
| **TR-02** | User Training | Huấn luyện thao tác nhận đơn cho 160 nhân viên quầy tại 80 chi nhánh. | T-3 ngày trước Go-Live | Operations Trainer + BA | 100% nhân viên làm bài test thực hành đạt từ 90/100 điểm. |
| **TR-03** | Parallel Run | Chạy song song ghi nhận doanh thu trên cả 2 hệ thống trong 14 ngày đầu. | T+1 đến T+14 ngày sau Go-Live | Kế toán trưởng + Tech Lead | Chênh lệch số liệu đối soát cuối ngày = 0 đồng. |
| **TR-04** | Rollback Plan | Kịch bản khôi phục database và chuyển hướng DNS về server cũ nếu phát sinh lỗi P1 sau 2 giờ cutover. | T-10 ngày trước Go-Live | DevOps Lead + Solution Architect | Đã diễn tập thử nghiệm thành công trên môi trường Staging. |
