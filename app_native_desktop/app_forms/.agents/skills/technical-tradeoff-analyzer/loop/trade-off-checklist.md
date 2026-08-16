# 🛡️ Quality Gate & Verification Checklist: Technical Trade-off Analyzer

> **Mục đích:** Bảng kiểm tra nhị phân (Pass/Fail) bắt buộc Agent phải tự rà soát trước khi bàn giao phân tích hoặc chốt quyết định kiến trúc cho User.

---

## 1. Gating Checklist (Chốt Kiểm Định Chất Lượng)

| # | Tiêu Chí Kiểm Tra (Check Item) | Kết Quả (Pass / Fail) | Bằng Chứng / Ghi Chú |
|---|---|:---:|---|
| **G1** | **Phân loại Quyết định (Decision Classification)**:<br>Đã tính toán $Risk\ Index$ và xác định rõ Type 1 (One-Way Door) vs Type 2 (Two-Way Door)? | `[PASS / FAIL]` | Risk Index = ... (Level ... x ...) |
| **G2** | **Reverse Probing (5 Failure Modes)**:<br>Đã rà soát 5 kịch bản thất bại (Lock Contention, Feedback Loop, Surrogate Pairs, Handle Leak, STA Starvation)? | `[PASS / FAIL]` | Có biện pháp phòng vệ tương ứng |
| **G3** | **Đầy đủ 6 Trục Đánh Đổi (6 Dimensions Covered)**:<br>Bảng Option Matrix có đủ 6 trục (Hiệu năng, An toàn, Đơn giản, Mô-đun, Testability, Blast Radius)? | `[PASS / FAIL]` | Đầy đủ cột và đánh giá màu 🟢/🟡/🔴 |
| **G4** | **Phân Tích Cân Bằng (Gain vs. Pain)**:<br>Mọi phương án đều được chỉ rõ điểm mạnh (Gain), điểm yếu (Pain) và biện pháp giảm thiểu (Mitigation)? Không thiên vị mù quáng? | `[PASS / FAIL]` | Đã nêu rõ Gain/Pain của từng option |
| **G5** | **Không Gian Phủ Định (Negative Space Contract)**:<br>Đã liệt kê tối thiểu 3 điều CẤM LÀM kèm theo hậu quả kỹ thuật nếu vi phạm? | `[PASS / FAIL]` | 3 điều cấm kèm Consequence |
| **G6** | **Neo Thực Tế (Code Grounding & Verification)**:<br>Các dẫn chứng có trỏ đến đúng file:dòng trong codebase? Đã kiểm tra build qua `dotnet build`? | `[PASS / FAIL]` | Không trỏ đường dẫn ảo |
| **G7** | **Zero-Placeholder Policy**:<br>Không chứa `TODO`, `FIXME`, hoặc nội dung chắp vá chưa hoàn thành? | `[PASS / FAIL]` | 100% nội dung hoàn chỉnh |

---

## 2. Quy Tắc Dừng Khẩn Cấp (Stop Conditions)

Agent **BẮT BUỘC DỪNG LẠI VÀ HỎI USER** nếu:
1. **Confidence < 70%** về ranh giới kiến trúc hoặc tính an toàn của P/Invoke.
2. Quyết định thuộc **Type 1 (One-Way Door)** ảnh hưởng đến cấu trúc `0_Shared` hoặc persist data mà chưa có sự đồng thuận bằng văn bản của User.
3. Không thể thiết kế được cơ chế test cô lập (`dotnet test`) cho logic nghiệp vụ mới.
