# AI-First Testing Architecture & Pattern Guide

> **Chủ đề**: Pattern Quản lý Test Unit & E2E cho Chrome Extension MV3 (AI-First Approach)
> **Phạm vi áp dụng**: Tất cả các Sub-module tại `src/3_modules/`, Platform Adapters, Engine và Playwright E2E Tests.

---

## 1. Nguyên Tắc Cốt Lõi (4 Core AI-First Testing Principles)

### 1.1 Module Domain Isolation (Cô lập theo Module Domain)
Mỗi sub-module được cấp một thư mục kiểm thử riêng biệt tại `tests/unit/3_modules/{module-name}/`. Tất cả spec runner, test helpers, và fixture data liên quan đến module đó bắt buộc nằm gọn trong thư mục này.

### 1.2 Strict Separation of Concerns (Tách biệt 100% Code & Data)
- **Code Spec (`index.spec.ts`)**: Chỉ chứa logic runner, assertions, và setup. Tuyệt đối không hardcode văn bản mẫu / mock payload dài quá 3 dòng code.
- **Fixture Data (`fixtures.json`)**: Chứa 100% dữ liệu đầu vào, ngữ cảnh thực tế, và kết quả kỳ vọng. 

### 1.3 Schema-Driven Fixture Contracts
Mỗi `fixtures.json` phải tuân theo cấu trúc dữ liệu chuẩn (`ITestFixtureCase<TInput, TExpect>`). Việc này giúp AI Agent khi tự động tạo thêm test cases thực tế luôn tạo dữ liệu chuẩn xác 100% type safety.

### 1.4 Single Source of Truth & Cross-Tier Reuse (Tái sử dụng Dữ liệu Unit ➔ E2E)
Dữ liệu trong `fixtures.json` của tầng Unit Test có thể được import và tái sử dụng trực tiếp trong Playwright E2E Tests mà không cần nhân bản dữ liệu mẫu.

---

## 2. Cấu Trúc Thư Mục Kiểm Thử Chuẩn (Standard Directory Tree)

```text
tests/
├── unit/                             # TẦNG 1: UNIT TESTS (Pure TS, Fast, Vitest)
│   ├── 1_engine/                     # Engine Background Unit Tests
│   ├── 2_platform_adapters/          # Platform Adapters Unit Tests
│   └── 3_modules/                    # Core Business Sub-Modules Unit Tests
│       ├── AGENTS.md                 # Quy chuẩn quản lý Test AI-First (File hiện tại)
│       ├── zalo-extract-single-message/
│       │   ├── index.spec.ts         # Spec Runner
│       │   ├── helpers.ts            # Mock DOM Adapters / Test Doubles
│       │   └── fixtures.json         # DOM Snippets & Target Texts
│       └── Sanitizer/ (hoặc zalo-message-sanitizer/)
│           ├── zalo-message-sanitizer.spec.ts # Spec Runner
│           └── fixtures.json         # Dữ liệu thực tế tin nhắn Zalo BĐS
│
├── integration/                      # TẦNG 2: INTEGRATION TESTS (IPC Bridge & Chains)
│   └── pipeline-chains/
│       ├── extract-to-sanitize.spec.ts # Test luồng nối giữa Extract ➔ Sanitize
│       └── fixtures.json
│
└── e2e/                              # TẦNG 3: E2E TESTS (Playwright + Chrome MV3)
    ├── fixtures/                     # Custom Playwright Fixtures (Extension Loader, Context)
    ├── pages/                        # Page Object Model (POM: ZaloWebPage, PopupPage)
    └── flows/                        # End-to-End User Flow Tests
        └── extract-sanitized-share.spec.ts # Dùng chung fixtures từ unit/fixtures.json
```

---

## 3. Pattern Viết Mã Nguồn Spec Runner (`index.spec.ts`)

File spec runner tuân thủ pattern **Data-Driven Dynamic Execution**:

```typescript
import { describe, expect, it } from 'vitest';
import { ZaloMessageSanitizerModule } from '../../../../src/3_modules/sub-modules/zalo-message-sanitizer';
import testFixtures from './fixtures.json';

describe('ZaloMessageSanitizerModule — AI-First Data Driven Tests', () => {
  const module = new ZaloMessageSanitizerModule();

  describe('Managed Fixtures Execution', () => {
    it.each(testFixtures)(
      '$id: $description',
      async ({ id, rawInput, expectRemovedCommission, expectRemovedBranding, shouldContain, shouldNotContain }) => {
        const result = await module.process({
          traceId: `tr-test-${id}`,
          rawText: rawInput,
        });

        expect(result.success).toBe(true);
        expect(result.metadata.removedCommission).toBe(expectRemovedCommission);
        expect(result.metadata.removedBranding).toBe(expectRemovedBranding);

        const sanitizedText = result.data?.sanitizedText ?? '';
        for (const str of shouldContain) {
          expect(sanitizedText).toContain(str);
        }
        for (const str of shouldNotContain) {
          expect(sanitizedText).not.toContain(str);
        }
      }
    );
  });
});
```

---

## 4. Hướng Dẫn Cho AI Agent Khi Tạo / Sửa Test

1. **Khi thêm mới một Sub-Module**:
   - Tạo thư mục `tests/unit/3_modules/{module-name}/`.
   - Tạo file `fixtures.json` quản lý dữ liệu mẫu trước.
   - Tạo file `index.spec.ts` thực thi data-driven runner.
2. **Khi thêm test case thực tế mới**:
   - **KHÔNG sửa code TS** trong `index.spec.ts`.
   - **Chỉ thêm 1 JSON object** vào `fixtures.json`.
3. **Khi viết E2E Test**:
   - Import trực tiếp `fixtures.json` từ `tests/unit/3_modules/{module-name}/fixtures.json` để đưa vào Playwright page object fill data.
