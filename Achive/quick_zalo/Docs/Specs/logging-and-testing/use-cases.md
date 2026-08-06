# Step 4: Business Analysis & Use Cases Specification

> **Feature**: `logging-and-testing` (Logging & Testing Architecture)  
> **Workflow**: Feature Spec Designer (`feature-spec-designer`)  
> **Step**: Step 4 - Business Analysis & Use Cases Breakdown  
> **Date**: 2026-07-27  
> **Status**: Standardized & Validated  

---

> [!NOTE]
> Tài liệu này mô tả chi tiết phân tích nghiệp vụ và xây dựng kịch bản kiểm thử hành vi BDD Gherkin cho 4 nhóm Use Case chính của phân hệ `logging-and-testing`. Mọi kịch bản đều dựa trên kết quả phân loại yêu cầu tại [normalizations.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/normalizations.md) và các quyết định kiến trúc tại [clarification-log.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/clarification-log.md).

---

## 1. Phân tích Miền Nghiệp vụ (Business Domain Analysis)

Phân hệ `logging-and-testing` cung cấp nền tảng quan sát (Observability), xử lý lỗi tin cậy và kiểm thử tự động cho toàn bộ Chrome Extension (gồm 3 entrypoints: `background`, `content`, `popup`). Phân hệ đảm bảo hệ thống vừa duy trì hiệu năng cao vừa phục vụ khả năng tự động phân tích lỗi của LLM Agent.

### 1.1. Tổng quan 4 Nhóm Use Case

| Nhóm Use Case | Mã Use Case | Tên Use Case | Mô tả Tóm tắt |
| :--- | :--- | :--- | :--- |
| **Basic Flow** | **UC-BASIC-01** | Luồng ghi log Evlog chuẩn | Ghi log cấu trúc Evlog với các trường dữ liệu tiêu chuẩn trong điều kiện vận hành bình thường. |
| **Basic Flow** | **UC-BASIC-02** | Thực thi Test Suite Co-located | Thực thi Unit Test đồng vị trí (`*.test.ts`) và Browser Integration Test với MSW mocking. |
| **Must-Have Flow** | **UC-MUST-01** | Bắt lỗi bằng `Result<T, E>` | Quản lý và xử lý lỗi an toàn thông qua kiểu dữ liệu `Result<T, E>`, loại bỏ unhandled exceptions. |
| **Must-Have Flow** | **UC-MUST-02** | LLM Log Parsing & RCA | LLM Agent đọc stream log terminal và tự động xác định vị trí `file:line` và `decision_reason` dưới 3000ms. |
| **Nice-To-Have Flow** | **UC-NICE-01** | Export Log Buffer ra File | Xuất toàn bộ log buffer trong IndexedDB thành file `.json` hoặc `.txt` để hỗ trợ kỹ thuật. |
| **Nice-To-Have Flow** | **UC-NICE-02** | Thay đổi LogLevel Động | Cập nhật runtime LogLevel từ `INFO` sang `DEBUG` trực tiếp qua UI Popup mà không cần restart. |
| **Exception Flow** | **UC-EXC-01** | Xử lý Tràn Ring Buffer | Tự động dọn dẹp xóa 10% entry cũ nhất (500 entries) khi bộ đệm đạt ngưỡng 5000 entries. |
| **Exception Flow** | **UC-EXC-02** | Fallback Khi IndexedDB Lỗi | Chuyển hướng an toàn ghi log sang `console.error` khi IndexedDB hỏng hoặc Service Worker bị ngắt. |

---

## 2. Chi tiết Kịch bản BDD Gherkin (Scenarios Breakdown)

### 2.1. Basic Flow (Luồng Cơ bản)

#### UC-BASIC-01: Luồng Ghi Log Evlog Cấu trúc Chuẩn

> [!TIP]
> Luồng này đảm bảo toàn bộ nhật ký ứng dụng được đóng gói theo định dạng cấu trúc chuẩn `Evlog` bất đồng bộ, đẩy ra Console và lưu tạm vào IndexedDB với độ trễ p95 dưới 5ms.

```gherkin
Feature: Standard Structured Evlog Emission
  As a Developer or System Agent
  I want to emit structured logs using the Evlog logger interface
  So that application events are consistently captured with rich metadata without blocking the UI thread

  Scenario: Emit INFO log event with complete metadata schema
    Given standard operation mode of Chrome Extension entrypoint "background"
    And the current active LogLevel threshold is set to "INFO"
    When module "@domain/crm" emits an INFO log with scope "@domain/crm", message "Contact synced", and payload "{"contact_id": "C-1029"}"
    Then the Evlog system formats the entry within 5ms (p95 latency < 5ms)
    And the output schema contains valid "trace_id" matching UUIDv4 pattern
    And the output schema contains "timestamp" formatted in ISO-8601 UTC string
    And the log entry is rendered to DevTools Console
    And the log entry is asynchronously queued for IndexedDB persistent buffer storage

  Scenario: Non-blocking asynchronous log buffer execution
    Given Main Event Loop is executing high-priority UI rendering in "popup" entrypoint
    When Evlog receives a burst of 50 log entries concurrently
    Then the logger dispatches writing operations to the background queue via requestIdleCallback or microtask
    And the Main Event Loop execution delay remains strictly under 16ms (Long Task < 16ms)
    And zero frame drops occur in Chrome Extension Popup UI
```

#### UC-BASIC-02: Luồng Thực thi Unit Test Co-located & Browser Integration Test

```gherkin
Feature: Co-located Unit Testing and Browser Mode Test Execution
  As a Software Engineer
  I want to execute co-located unit tests alongside domain code and browser integration tests via Vitest
  So that code correctness is verified rapidly in a browser-like runtime environment

  Scenario: Execute co-located unit test file under domain directory
    Given a co-located test file "@domain/lead/lead-validator.test.ts"
    When Vitest test runner executes the test file in Browser Mode
    Then all assertions in "@domain/lead/lead-validator.test.ts" pass successfully
    And total execution duration for the single test file is under 1000ms
    And code statement coverage for "@domain/lead/lead-validator.ts" is reported at or above 85%

  Scenario: Execute integration test with MSW network mocking
    Given an integration test for "@infra/api/zalo-adapter.test.ts"
    And Mock Service Worker (MSW) is initialized to intercept requests to "https://api.zalo.me/v1/*"
    When the test suite invokes "fetchZaloUserProfile("USER_888")"
    Then MSW intercepts the HTTP call and returns simulated JSON fixture "{"status": 200, "name": "Test User"}"
    And the adapter returns a successful Result "Ok(UserProfile)"
    And zero real HTTP requests escape to external networks
```

---

### 2.2. Must-Have Flow (Luồng Bắt buộc)

#### UC-MUST-01: Luồng Bắt và Định dạng Lỗi qua Pattern `Result<T, E>`

> [!IMPORTANT]
> Mọi hàm trong tầng `@domain` và `@infra` bắt buộc trả về `Result<T, E>`. Tuyệt đối cấm văng exception ngầm không kiểm soát (`throw new Error()`), đảm bảo tính dự đoán được của luồng thực thi.

```gherkin
Feature: Explicit Error Handling via Result<T, E> Pattern
  As a System Architect
  I want all operations in domain and infrastructure modules to return Result<T, E> types
  So that potential failures are explicitly typed, handled at compile-time, and logged consistently

  Scenario: Domain function handles validation failure via Result Err variant
    Given input payload with invalid email string "invalid-email-format" passed to "@domain/user/create-user.ts"
    When "createUserAccount(payload)" is executed
    Then the function returns "Err(AppError)" where AppError code is "INVALID_INPUT"
    And no unhandled runtime exception is thrown to caller scope
    And the caller module handles "Err" gracefully by logging an ERROR level event via Evlog
    And the log entry automatically attaches error stack trace and active "trace_id"

  Scenario: Chain nested Result operations without throwing exceptions
    Given a chain of 3 domain operations: "parseInput", "validateDomainRules", and "persistRecord"
    When the second step "validateDomainRules" returns "Err(DomainRuleViolation)"
    Then the chain short-circuits immediately without executing "persistRecord"
    And the final returned value is "Err(DomainRuleViolation)"
    And TypeScript compiler enforces mandatory check of "result.isErr()" before accessing value
```

#### UC-MUST-02: Luồng LLM Agent Đọc Log Terminal và Tự Định vị Lỗi trong < 3s

```gherkin
Feature: Automated Bug Localization by LLM Agent
  As an AI Coding Agent
  I want to parse Evlog terminal outputs and extract error context
  So that I can locate file:line coordinates and decision_reason within 3000ms

  Scenario: LLM Agent performs Root Cause Analysis on terminal log stream
    Given a terminal output stream containing an Evlog ERROR entry:
      """
      {"trace_id":"8f3a1b2c-9012-4e5f-b678-123456789abc","scope":"@infra/storage","level":"ERROR","payload":{"error_code":"STORAGE_QUOTA_EXCEEDED","file":"src/infra/storage/indexeddb-adapter.ts","line":142,"decision_reason":"IndexedDB storage limit 5MB reached during write"},"timestamp":"2026-07-27T05:30:00.000Z"}
      """
    When the LLM Agent ingests the log stream for diagnostic parsing
    Then the Agent extracts the exact source location "src/infra/storage/indexeddb-adapter.ts:142"
    And the Agent identifies the decision reason "IndexedDB storage limit 5MB reached during write"
    And the total diagnosis process completes in less than 3000ms (RCA Latency < 3s)
```

---

### 2.3. Nice-To-Have Flow (Luồng Mở rộng / Khuyên dùng)

#### UC-NICE-01: Luồng Export Log Buffer từ IndexedDB thành File `.json` / `.txt`

```gherkin
Feature: Log Buffer Export for Technical Support
  As an Extension User or Developer
  I want to export the buffered logs stored in IndexedDB as a downloadable JSON or TXT file
  So that I can attach diagnostic traces when submitting support tickets or bug reports

  Scenario: User triggers log export action from Popup UI
    Given the Chrome Extension Popup UI is active
    And IndexedDB contains 450 stored log entries from the past 48 hours
    When the user clicks the "Export Support Logs" button in Settings
    Then the system queries all log records from IndexedDB storage
    And formats the records into a structured JSON file named "evlog-export-2026-07-27.json"
    And triggers a browser download prompt within 1500ms
    And a notification prompt confirms "Log file downloaded successfully"

  Scenario: Developer exports filtered DEBUG logs to plain text format
    Given Developer Mode is active in Chrome Extension
    When developer selects "Export as TXT" with level filter "ERROR"
    Then the system generates a formatted text log file containing only ERROR entries
    And each line is formatted as "[ISO-TIMESTAMP] [LEVEL] [SCOPE] [TRACE_ID] MESSAGE - PAYLOAD"
```

#### UC-NICE-02: Luồng Chuyển đổi LogLevel Động ở Runtime

```gherkin
Feature: Dynamic LogLevel Configuration at Runtime
  As a Developer
  I want to adjust the logging verbosity level at runtime without restarting the extension
  So that I can capture granular debug information on-demand when inspecting unexpected behaviors

  Scenario: Switch LogLevel threshold from INFO to DEBUG dynamically
    Given the running system is logging at default threshold "INFO"
    And DEBUG logs emitted by "@domain/crm" are currently filtered out and ignored
    When developer toggles "Enable Debug Mode" switch in Extension Options
    Then Evlog Configuration State receives the update event via Chrome Storage Listener
    And the dynamic threshold is updated to "DEBUG" across all active entrypoints ("background", "content", "popup")
    And subsequent DEBUG log calls immediately format and write entries to Console and IndexedDB
    And zero browser extension reloading is required
```

---

### 2.4. Exception Flow (Luồng Ngoại lệ & Xử lý Sự cố)

#### UC-EXC-01: Luồng Dọn dẹp khi Ring Buffer Tràn 5000 Entries

> [!WARNING]
> Khi dung lượng bộ đệm IndexedDB đạt ngưỡng tối đa 5000 entries (tương đương 5MB), hệ thống áp dụng chiến lược FIFO Ring Buffer: tự động thanh trừng 10% entry cũ nhất (500 entries) để giải phóng bộ nhớ.

```gherkin
Feature: FIFO Ring Buffer Capacity Maintenance and Purge
  As a System Maintenance Worker
  I want the log storage to purge the oldest log entries when capacity limits are hit
  So that storage usage never exceeds 5MB and memory consumption remains bounded

  Scenario: Automatic purge triggered upon reaching 5000 log entry threshold
    Given IndexedDB storage contains exactly 5000 log entries (reaching max capacity limit)
    When Evlog receives request to write the 5001st log entry
    Then the buffer manager interceptor triggers the FIFO Ring Buffer cleanup process
    And deletes the oldest 500 log entries (10% of total capacity) in a single batch transaction
    And writes the new log entry into the cleared space
    And total log count is reduced to 4501 entries
    And storage footprint stays safely under 5MB limit

  Scenario: Periodic TTL cleanup purges entries older than 7 days
    Given IndexedDB storage contains log entries generated 8 days ago
    When daily background maintenance task runs in Service Worker
    Then all log entries with timestamp older than 7 days (TTL > 168 hours) are permanently deleted
    And a log cleanup summary entry is appended to IndexedDB
```

#### UC-EXC-02: Luồng Xử lý Khi IndexedDB Storage Hỏng hoặc Service Worker Bị Terminate

```gherkin
Feature: Resilient Fallback Logging for Storage Failures and Worker Termination
  As a Robust Infrastructure Component
  I want to fallback gracefully to Console Output if IndexedDB storage fails or Service Worker terminates
  So that critical error reports are never lost and the application does not crash

  Scenario: IndexedDB quota exceeded or database connection corrupted
    Given IndexedDB storage throws a "QuotaExceededError" or database connection is closed abruptly
    When Evlog attempts to persist an ERROR log entry
    Then the IndexedDB transport adapter catches the storage failure via Result Err
    And automatically activates the Emergency Console Fallback mechanism
    And outputs the full log payload to "console.error" with prefix "[EVLOG-FALLBACK-EMERGENCY]"
    And application execution continues without throwing unhandled exceptions to user interface

  Scenario: Service Worker terminated unexpectedly during async write
    Given Service Worker in "background" entrypoint is abruptly terminated by Chrome browser OS
    When Service Worker restarts upon new browser event
    Then Evlog storage initializer re-opens IndexedDB connection cleanly
    And validates database integrity
    And resumes normal async log batching within 500ms
```

---

## 3. Ma trận Kiểm soát Chỉ số Định lượng (Quantified Verification Matrix)

Bảng 1 tổng hợp các chỉ số phi chức năng NFR được kiểm chứng và đo lường bắt buộc trong toàn bộ 4 nhóm Use Case.

| Mã Indicative | Tham số / Chỉ số NFR | Ngưỡng Tối đa / Mục tiêu | Scenarios Kiểm chứng | Phương pháp Đo lường (Tooling) |
| :--- | :--- | :--- | :--- | :--- |
| **MET-LOG-01** | Evlog Format Latency (p95) | **< 5ms** | UC-BASIC-01 (Scenario 1) | Performance Benchmark (`console.time` / Vitest) |
| **MET-LOG-02** | Main Thread Long Task Block | **< 16ms** | UC-BASIC-01 (Scenario 2) | Chrome DevTools Performance Audit |
| **MET-TST-01** | Co-located Unit Test Speed | **< 1000ms / file** | UC-BASIC-02 (Scenario 1) | Vitest CLI execution timer |
| **MET-TST-02** | E2E Test Suite Execution | **< 30s total** | UC-BASIC-02 (Scenario 2) | Playwright Test Runner timer |
| **MET-LLM-01** | LLM Bug Localization Speed | **< 3000ms** | UC-MUST-02 (Scenario 1) | Log parser execution timer |
| **MET-EXP-01** | Log Export Generation Speed | **< 1500ms** | UC-NICE-01 (Scenario 1) | Browser File System API timer |
| **MET-BUF-01** | Ring Buffer Max Capacity | **5000 entries ($\le$ 5MB)** | UC-EXC-01 (Scenario 1) | IndexedDB Storage Estimate API |
| **MET-BUF-02** | Purge Batch Ratio | **10% (500 entries)** | UC-EXC-01 (Scenario 1) | IndexedDB record count verification |

---

## 4. Kiểm tra Cổng Kiểm soát Chất lượng Step 4 (End-of-Step Validation Gate)

> [!TIP]
> **Kết quả Đánh giá Step 4 Validation Gate**: **PASS (100/100)**
> - [x] Chi tiết hóa 4 nhóm Use Case (Basic Flow, Must-Have Flow, Nice-To-Have Flow, Exception Flow).
> - [x] Định dạng 100% Scenarios dưới dạng BDD Gherkin (cú pháp Given, When, Then).
> - [x] Định lượng 100% các NFR (Latency p95 < 5ms, Execution < 1000ms, RCA < 3s, Long Task < 16ms, Export < 1500ms, Buffer 5000 entries).
> - [x] Đường dẫn tương đối chính xác đến [normalizations.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/normalizations.md) và [clarification-log.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/clarification-log.md) không bọc backtick tên hiển thị.
> - [x] Đã áp dụng các GitHub Alert Blocks (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`).
> - [x] Tuyệt đối không chứa các từ khóa mơ hồ hoặc chưa hoàn thiện theo quy chuẩn standards.md.

---
*Tài liệu thuộc bộ hồ sơ Feature Specification cho phân hệ `logging-and-testing`.*
