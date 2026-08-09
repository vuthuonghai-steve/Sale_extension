# Forms Chrome Extension MV3 (WXT + Vite 8 + React 19)

Dự án Chrome Extension **Manifest V3 (MV3)** chuẩn AI-First, tối ưu hóa cho **Chromium V8 Engine**, sử dụng framework **WXT + Vite 8 + React 19 + TypeScript** và kiến trúc 5 phân lớp.

---

## 🚀 Công nghệ & Kiến trúc

| Thành phần | Công nghệ / Tiêu chuẩn | Mô tả |
| :--- | :--- | :--- |
| **Nền tảng** | Manifest V3 (MV3) | Service Worker ngầm, Host Permissions, Side Panel, Content Script |
| **Framework** | WXT 0.21.3 + Vite 8.2.0 | Hot-Module Reload (HMR), tối ưu bundle, multi-entrypoints |
| **UI Framework** | React 19 | Hooks hiện đại, `@wxt-dev/module-react` |
| **Ngôn ngữ** | TypeScript 6 Strict Mode | Path Aliases 5 layer, zero `any` |
| **Kiểm thử** | Vitest 4 + `@vitest/coverage-v8` | V8 Coverage engine cho Layer 3 (đạt >90% line coverage) |
| **E2E Testing** | Playwright 1.62 | Khởi chạy extension trên Chromium thật |
| **Kiểm soát kiến trúc** | `dependency-cruiser` | Enforce ranh giới 5 layer không import ngược |
| **AI-First Layer** | `.agents/` | AI Rules, Skills và Hooks kiểm soát tự động |

---

## 🏛️ Cấu trúc 5 Phân lớp (5-Layer Architecture)

```
Forms/
├── src/
│   ├── 0_contracts/          # Types, Zod schemas, Storage schema, IPC Actions & Payloads
│   ├── 1_engine/             # WXT Entrypoints (Background SW, Content Script, Popup, SidePanel, Options, DebugConsole)
│   ├── 2_platform_adapters/  # Bọc Chrome APIs (Storage, IPC Bus, Central Logger, Config Loader)
│   ├── 3_modules/            # Pure TypeScript business logic (100% testable, no DOM/Chrome dependencies)
│   └── 4_presentation/       # React 19 UI Views, Components, Glassmorphism Tokens
├── tests/
│   ├── unit/                 # Unit tests cho Layer 3 modules
│   ├── contract/             # Schema validation tests cho Layer 0 contracts
│   └── e2e/                  # Playwright E2E tests
├── scripts/
│   └── validate-env.ts       # Script xác thực .env trước build
├── .agents/                  # AI-First guardrails, rules, hooks & skills
├── wxt.config.ts             # Cấu hình WXT Manifest V3
├── vitest.config.ts          # Cấu hình Vitest với coverage V8
└── package.json
```

---

## 🛠️ Hướng dẫn phát triển

### 1. Cài đặt dependencies
```bash
pnpm install
```

### 2. Chạy môi trường Dev (Hot Reload)
```bash
pnpm dev
```

### 3. Kiểm tra kiểu dữ liệu (Typecheck)
```bash
pnpm typecheck
```

### 4. Chạy kiểm thử Unit & Coverage (V8 Engine)
```bash
pnpm test
pnpm test:coverage
```

### 5. Kiểm tra ranh giới kiến trúc
```bash
pnpm arc1
```

### 6. Build bản phát hành (Production MV3)
```bash
pnpm build
```
Bundle xuất ra tại: `.output/chrome-mv3`

---

## 📦 Cài đặt Extension vào Chrome / Edge / Cốc Cốc

1. Mở trình duyệt và truy cập `chrome://extensions/`.
2. Bật chế độ **Developer mode** (Góc trên bên phải).
3. Nhấn **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục: `c:\Users\ADMIN\Documents\workspace\Sale_extension\Forms\.output\chrome-mv3`.
