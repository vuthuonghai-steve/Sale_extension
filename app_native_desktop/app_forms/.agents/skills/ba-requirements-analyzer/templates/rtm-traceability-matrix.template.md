# Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix - Skeleton Outline)

**Tên dự án**: [Tên Dự Án]  
**Phiên bản**: [1.0.0] | **Ngày lập**: [YYYY-MM-DD]  
**Mục tiêu**: Đảm bảo 100% yêu cầu kỹ thuật phục vụ mục tiêu kinh doanh (Chống Gold-plating) và 100% mục tiêu kinh doanh có giải pháp hỗ trợ (Chống Orphaned Goals).

---

## 1. Bảng Ma Trận RTM Đa Tầng (Bi-Directional Traceability Matrix)

| Business Req (BR) | Stakeholder Req (SR) | Functional Req (FR) | Non-Functional Req (NFR) | Transition Req (TR) | Test Case / UAT ID | Trạng Thái | Kiểm Định Gold-Plating / Orphaned Goal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **[BR-01]**: [Tên mục tiêu BR] | **[SR-01]**: [Nhu cầu Persona] | **[FR-01]**: [Hành vi hệ thống] | **[NFR-01]**: [Chỉ số đo lường] | **[TR-01]**: [Yêu cầu chuyển tiếp] | **[TC-01]** | [Ready/In Progress] | ✅ Hợp lệ (Đầy đủ chuỗi từ BR đến Test) |
| **[BR-02]**: [Tên mục tiêu BR] | **[SR-02]**: [Nhu cầu Persona] | **[FR-02]**: [Hành vi hệ thống] | **[NFR-02]**: [Chỉ số đo lường] | **[TR-02]**: [Yêu cầu chuyển tiếp] | **[TC-02]** | [Ready/In Progress] | ✅ Hợp lệ (Đầy đủ chuỗi từ BR đến Test) |

---

## 2. Báo Cáo Kiểm Định Traceability (Audit Summary Report)

### 2.1. Phân Tích Độ Phủ Top-Down (Coverage Analysis)
- **Tổng số Business Requirements (BR)**: [Số lượng]
- **Số BR đã được phân rã đầy đủ thành FR/NFR**: [Số lượng]
- **Danh sách BR bị bỏ rơi (Orphaned Goals)**:
  - *Liệt kê các BR chưa có FR/NFR tương ứng, hoặc ghi rõ "Không có - 100% BR đều có giải pháp hỗ trợ"*

### 2.2. Kiểm Tra Ngược Bottom-Up (Gold-Plating Audit)
- **Tổng số Functional Requirements (FR)**: [Số lượng]
- **Số FR truy ngược thành công về ít nhất 1 BR**: [Số lượng]
- **Danh sách FR nghi ngờ Gold-plating (Mạ vàng / Dư thừa)**:
  - *Liệt kê các FR mồ côi không phục vụ BR nào, hoặc ghi rõ "Không có - 100% FR đều có mục tiêu BR bảo trợ"*

### 2.3. Kiểm Tra Yêu Cầu Chuyển Tiếp (Transition Readiness)
- **Data Migration Plan**: [Đã xác định / Không áp dụng]
- **Operational Training Plan**: [Đã xác định / Không áp dụng]
- **Cutover & Rollback Scenario**: [Đã xác định / Không áp dụng]
