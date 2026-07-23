---
description: "Quy chuẩn công nghệ, cấu trúc thư mục và chuẩn mực lập trình TypeScript / WXT"
activation: "Glob"
globs: ["*.ts", "*.html", "wxt.config.ts", "package.json"]
---

# 💻 Rule: Tech Stack & Coding Conventions

Rule này áp dụng tự động cho các file nguồn mã lệnh (`.ts`, `.html`, file cấu hình WXT/NPM).

## 1. Stack & Tooling Chuẩn
- **Framework:** WXT (Web Extension Tools) `^0.20.27` + Vite.
- **Language:** TypeScript `^5.9.3` trong chế độ strict.
- **UI Popup:** Vanilla HTML + CSS + TypeScript (không dùng React/Vue để tối ưu bundle size ~21kB).

## 2. Naming & Folder Conventions
- **Thư mục entrypoint:** `entrypoints/` chứa `background.ts`, `content.ts`, và `popup/`.
- **Thư mục tiện ích:** `utils/` chứa các module thuần TypeScript hỗ trợ tự động hóa (`automation.ts`).
- **Đặt tên file:** Kebab-case (`content-script.ts`, `admin-lookup.ts`).
- **Đặt tên Type/Interface:** PascalCase (`AutoFillOptions`, `ScrapeResult`).

## 3. Standard Coding Practices
- Khai báo rõ ràng kiểu dữ liệu trả về cho mọi hàm public helper.
- Ưu tiên `const` hơn `let`, tuyệt đối không dùng `var`.
- Sử dụng ES Modules (`import/export`).
