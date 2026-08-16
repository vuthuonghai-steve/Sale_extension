# 01. LLM Core Principles & Development Philosophy

Tài liệu này định nghĩa các nguyên tắc tối thượng mà mọi AI Agent và kỹ sư phát triển bắt buộc phải tuân thủ tuyệt đối khi thao tác với codebase `AppForms`.

---

## 1. 🛡️ Triết Lý "Do No Harm" & Bảo Toàn Codebase

1. **Không Placeholder / Không Stub Dở Dang**:
   - Tuyệt đối không để lại code dạng `// TODO: Implement later`, `throw new NotImplementedException()`, hoặc comment tóm tắt bỏ trống thân hàm (`// ...`).
   - Mọi phương thức, lớp hoặc hàm được sinh ra phải hoàn chỉnh, có thể biên dịch và chạy được ngay (`dotnet build`).
2. **Context Before Mutation**:
   - Trước khi sửa đổi bất kỳ file nào, Agent **bắt buộc** phải đọc và hiểu toàn bộ ngữ cảnh liên quan (DI registration trong `Program.cs`, Contracts trong `1_Backend/Contracts/`, Types trong `0_Shared/Types/`).
   - Không được giả định sự tồn tại của class hay property mà không kiểm chứng qua codebase.
3. **Preserve Functionality & Architecture**:
   - Giữ nguyên các chức năng, docstrings, và comments hiện có không liên quan trực tiếp đến nội dung thay đổi.
   - Luôn tuân theo phân tầng Clean Layered Architecture (`0_Shared` -> `1_Backend` -> `2_Frontend`).

---

## 2. 🧱 Component-Driven & Hook Pattern

- Code WinForms trong dự án tuân theo tư duy **Component-Driven UI** kết hợp **State Hook Controller** (tương tự React Hook nhưng triển khai chuẩn C# Event-Driven).
- **Phân tách tuyệt đối giữa View và Logic**:
  - `*Screen.cs` chỉ là Root Container ghép nối layout, dung lượng **không vượt quá 150 dòng**.
  - `Components/` chịu trách nhiệm render các widget UI cụ thể (Card, Panel, ActionBox).
  - `Hooks/` chịu trách nhiệm quản lý state, nhận event từ Services và cung cấp actions cho UI.
  - Không bao giờ đặt logic I/O, regex, hoặc tính toán nghiệp vụ trong các event click UI.

---

## 3. 🎯 Contract-First & Type Discipline

- Mọi tương tác giữa Frontend và Backend phải thông qua Interface rõ ràng (`1_Backend/Contracts/Interfaces/`).
- Phân biệt minh bạch các loại Type:
  - **Interface**: Giao tiếp, DI và Test Mocking.
  - **Entity**: Thực thể nghiệp vụ cốt lõi, lưu trữ lâu dài (`AppSettings`, `LeadEntity`).
  - **Schema**: Cấu trúc định nghĩa động cho form (`FormatSchema`).
  - **Screen Model / DTO**: State và Form binding riêng cho từng Screen (`*FormModel.cs`).
  - **Shared Types**: Enums, Event Args chung (`0_Shared/Types/`).

---

## 4. 🪵 Observability & Structured Logging

- Không dùng `Console.WriteLine` hay `Debug.WriteLine`.
- Sử dụng **Serilog / Microsoft.Extensions.Logging** đã được tích hợp toàn diện qua DI:
  - Daily Rolling Logs: `Logs/app-yyyyMMdd.log`
  - Session Debug Logs: `Logs/Sessions/session-latest.log`
- Mọi thao tác I/O, chuyển đổi dữ liệu, bắt lỗi ngoại lệ đều phải được ghi log cấu trúc với ngữ cảnh chi tiết (`Log.Information`, `Log.Warning`, `Log.Error`, `Log.Fatal`).

---

## 5. 🚦 Quality Gates & Verification

- Trước khi hoàn tất bất kỳ task nào, Agent phải:
  1. Chạy `dotnet build` kiểm tra 0 Error, 0 Warning nghiêm trọng.
  2. Đảm bảo file Screen không vượt quá 150 dòng.
  3. Đảm bảo không vi phạm ranh giới kiến trúc (Frontend không trực tiếp gọi I/O bỏ qua Service, Service không phụ thuộc WinForms UI).
