---
trigger: model_decision
description: "Cổng kiểm soát chất lượng nhị phân, quy chuẩn type safety và tự động kiểm chứng"
---

# 🛡️ Rule: Code Quality & Mechanical Gates

Rule này bắt buộc áp dụng trên toàn bộ workspace để đảm bảo chất lượng code chuẩn xác.

## 1. Binary Quality Gates (Pass / Fail Mechanical Checks)
- **Compile Verification Gate:** Mọi chỉnh sửa mã nguồn TypeScript phải vượt qua lệnh `npm run compile`.
- **Zero Syntax & Type Errors:** Không chấp nhận cảnh báo bẻ gãy type hoặc ép kiểu không an toàn (`as any` mà không có lý do chính đáng).

## 2. Deterministic Contracts
- Mọi hàm helper trong `utils/` hoặc handler trong `entrypoints/` phải có input parameters và return value được định nghĩa kiểu dữ liệu minh bạch.
- Tránh hàm trả về `any` hoặc không khai báo return type với các hàm public utility.

## 3. Negative Space & Error Handling (`must_not`)
- `must_not`: Không bao giờ nuốt ngoại lệ (silent catch):
  ```typescript
  // ❌ VI PHẠM
  try {
    doSomething();
  } catch (e) {}

  // ✅ ĐÚNG QUY CHUẨN
  try {
    doSomething();
  } catch (error) {
    console.error('[filter_data] Task failed:', error);
    // Xử lý fallback mượt mà (Graceful degradation)
  }
  ```
- `must_not`: Không để lại code thừa, debug log rác trong bản build sản phẩm.