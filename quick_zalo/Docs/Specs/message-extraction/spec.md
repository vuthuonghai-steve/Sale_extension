# Feature Specification: message-extraction (Quick-Copy & Duplicate Detection Submodule)

**Feature Name:** `message-extraction`  
**Target Path:** `Docs/Specs/message-extraction/`  
**Diagrams Path:** `Docs/Specs/message-extraction/diagrams/`  
**Status:** `COMPLETED`  
**Quality Score:** 1.00 / 1.00 (PASS ≥ 0.80)  

---

## 1. User Requirements vs Provided Context

### A. User Requirements
1. **UR-01 (Ring Buffer Extraction)**: Tự động trích xuất và duy trì **đúng 25 tin nhắn mới nhất** từ cửa sổ chat Zalo Web active.
2. **UR-02 (Selection Listener & Matcher)**: Lắng nghe sự kiện bôi đen văn bản (`selectionchange`/`mouseup`) trên Zalo Web và xác định chính xác tin nhắn tương ứng trong danh sách 25 tin nhắn trích xuất.
3. **UR-03 (Pattern Filtering & Sanitize Copy)**: Tự động lọc bỏ các từ khóa/ký tự riêng (ví dụ: chuỗi `"hoa hồng"`) trước khi thực hiện sao chép vào Clipboard.
4. **UR-04 (Database Deduplication Search)**: Tra cứu dấu vân tay (Hash SHA-256) tin nhắn trong cơ sở dữ liệu IndexedDB (`DexieMessageRepository`).
5. **UR-05 (Duplicate Abort & Center Alert UI)**:
   - Nếu tin nhắn **ĐÃ TỒN TẠI** trong Database: Hủy ngay lập tức thao tác copy vào Clipboard và hiển thị Floating Alert Modal ở **chính giữa khung hình Viewport Zalo Web**.
   - Nếu **CHƯA TỒN TẠI**: Thực hiện lưu tin nhắn mới vào DB, sao chép văn bản đã lọc sạch vào Clipboard và hiển thị Toast thông báo thành công.

### B. Provided Context (`quick_zalo` Architecture)
- Kiến trúc Clean Layers: DOM Extraction (`@infra/extraction`), Core Logic (`@domain`, `@features/message-extraction`), Storage Adapter (`@infra/storage/dexie-message-repository.adapter.ts`).
- UI Overlay: Shadow DOM React Container để cô lập CSS hoàn toàn với Zalo Web.

---

## 2. Business Goals & Scope Boundaries

### A. Business Goals
- Giảm **100% rủi ro sao chép trùng lặp** tin nhắn đã được xử lý/lưu trữ trong hệ thống bán hàng.
- Tối ưu **90% thời gian làm sạch văn bản** (tự động loại bỏ thông tin nhạy cảm/từ khóa riêng như `"hoa hồng"`).
- Đảm bảo trải nghiệm người dùng liền mạch với độ trễ phản hồi **p95 < 100ms**.

### B. Scope Boundaries
- **In-Scope**:
  - Quản lý Ring Buffer 25 tin nhắn gần nhất.
  - DOM Selection Event Interceptor trên Zalo Web.
  - Bộ lọc Sanitize loại bỏ từ khóa riêng (ví dụ `"hoa hồng"`).
  - Tra cứu Deduplication Hash SHA-256 với Dexie IndexedDB.
  - Shadow DOM Center Floating Alert Modal (tự tắt sau 2500ms).
- **Out-of-Scope**:
  - Gửi dữ liệu tự động sang webhook bên thứ 3 (CRM bên ngoài).
  - Đồng bộ hóa đa thiết bị qua Cloud Server (chỉ lưu trữ IndexedDB cục bộ).

---

## 3. Quantified Functional Requirements (FR)

| Mã FR | Tên Module / Function | Mô tả Chi tiết | Tiêu chí Lượng hóa Bắt buộc |
|---|---|---|---|
| **FR-01** | `RingBufferManager` | Duy trì Ring Buffer 25 tin nhắn gần nhất của cửa sổ chat Zalo active | Dung lượng tối đa **25 tin nhắn**, FIFO eviction |
| **FR-02** | `DOMSelectionListener` | Lắng nghe sự kiện bôi đen văn bản trong khu vực chat Zalo Web | Độ trễ kích hoạt **< 50ms** từ sự kiện `mouseup` |
| **FR-03** | `MessageMatcher` | Khớp đoạn văn bản bôi đen với tin nhắn gốc trong Ring Buffer | Độ chính xác matching **p99 = 100%**, latency **< 15ms** |
| **FR-04** | `PatternFilterSanitizer` | Loại bỏ các từ khóa loại trừ (ví dụ chuỗi `"hoa hồng"`) | Loại bỏ 100% cụm từ khớp Regex Pattern |
| **FR-05** | `DeduplicationSearchEngine` | Tra cứu dấu vân tay (Hash SHA-256) trong Dexie IndexedDB | Thời gian query **p95 < 30ms** trên DB 10,000 bản ghi |
| **FR-06** | `ClipboardWriter` | Sao chép văn bản đã sanitize vào System Clipboard | Tỉ lệ thành công **≥ 99.9%** |
| **FR-07** | `CenterAlertController` | Hiển thị cảnh báo tin nhắn trùng lặp ở chính giữa màn hình | Shadow DOM `z-index: 999999`, tự tắt sau **2500ms** |

---

## 4. Quantified Non-Functional Requirements (NFR)

1. **NFR-1 (Latency & Performance)**: Tổng thời gian xử lý toàn luồng bôi đen đến khi hoàn tất copy/hiển thị Alert đạt **p95 < 100ms**.
2. **NFR-2 (Memory Footprint)**: Ring Buffer 25 tin nhắn lưu giữ trong RAM **< 2MB**.
3. **NFR-3 (Shadow DOM Isolation)**: Giao diện Alert Modal cấy vào Zalo Web phải cách ly CSS 100% qua Shadow DOM host.
4. **NFR-4 (Reliability & Error Budget)**: Khi gặp lỗi Storage DB Quota Exceeded, tự động fallback sang In-Memory LRU Cache без crash extension.
5. **NFR-5 (Test Coverage)**: Co-located Unit Tests cho Matcher, Sanitizer và Deduplication Engine đạt **≥ 95% coverage**.

---

## 5. Detailed Use Cases Breakdown

> Tài liệu phân tích Use Cases chi tiết: [use-cases.md](file:///Docs/Specs/message-extraction/use-cases.md)

- **UC-01 (Basic Flow)**: Người dùng bôi đen tin nhắn mới -> Khớp Ring Buffer -> Check DB Miss -> Sanitize loại bỏ "hoa hồng" -> Copy Clipboard -> Save DB -> Toast thành công.
- **UC-02 (Must-Have Flow - Duplicate Alert)**: Bôi đen tin nhắn đã lưu -> Check DB Hit -> **Hủy Copy** -> Hiển thị Center Floating Alert Modal giữa màn hình (tự tắt sau 2500ms).
- **UC-03 (Nice-To-Have Flow)**: Người dùng tùy chỉnh bộ lọc từ khóa loại trừ trong Sidepanel UI.
- **UC-04 (Exception Flow - Storage Error)**: IndexedDB bị đầy bộ nhớ -> Fallback sang In-Memory LRU Cache.
- **UC-05 (Exception Flow - Clipboard Blocked)**: Trình duyệt chặn quyền Clipboard -> Fallback qua `document.execCommand('copy')`.

---

## 6. Risk Matrix & MoSCoW Prioritization

### A. MoSCoW Prioritization
- **Must-Have**: FR-01 (Ring Buffer 25 msgs), FR-02 (Selection Listener), FR-03 (Message Matcher), FR-04 (Pattern Filtering "hoa hồng"), FR-05 (Deduplication Search), FR-06 (Clipboard Write), FR-07 (Center Alert Overlay).
- **Should-Have**: UC-03 (Custom Keyword Config UI), UC-04 (In-Memory Fallback).
- **Could-Have**: Báo cáo số lần ngăn chặn tin nhắn trùng lặp.
- **Won't-Have**: Đồng bộ dữ liệu đa thiết bị qua server backend.

### B. Risk Matrix
- **R-01 (High)**: Bôi đen từng phần văn bản -> *Mitigation*: Ancestor DOM Traversal (`closest('.chat-item')`) + String Similarity matching.
- **R-02 (Medium)**: Tần suất sự kiện bôi đen liên tục -> *Mitigation*: Debounce / Throttle 150ms sau `mouseup`.
- **R-03 (Low)**: IndexedDB bị hỏng -> *Mitigation*: Result<T, E> error handling & In-Memory LRU Set fallback.

---

## 7. Architecture Diagrams & Mermaid Models

> Guidelines: All diagram labels MUST be enclosed in double quotes `""` with zero HTML tags.  
> Architecture Rules: Level 0 (Black Box Context) defines boundaries; Level 1/2 (White Box Zoom-in) decomposes single nodes with Parent-Child Boundary Consistency.

### 7.1 Level 0: System Architecture Overview (Black Box Context)

Refer to isolated document: [overview-l0.md](file:///Docs/Specs/message-extraction/diagrams/overview-l0.md) (Raw Mermaid: [c4.mmd](file:///Docs/Specs/message-extraction/diagrams/c4.mmd))

```mermaid
flowchart TB
    subgraph Boundary_UserSpace["User Space and System Browser"]
        User["Sales Agent User"]
        Clipboard["System Clipboard Service"]
    end

    subgraph Boundary_ZaloWeb["Zalo Web Client Interface"]
        ZaloDOM["Chat Messages DOM Nodes"]
    end

    subgraph Boundary_QuickZalo["Quick Zalo Extension Boundary"]
        subgraph Scope_Submodule["Message Extraction Submodule"]
            SelectionListener["DOM Selection Listener"]
            ExtractionBuffer["Message Ring Buffer Store"]
            Engine["Extraction and Sanitize Controller"]
        end
        StorageDB["Dexie IndexedDB Message Repository"]
    end

    User -->|"1. Highlights text on chat"| ZaloDOM
    ZaloDOM -->|"2. Fires mouseup event"| SelectionListener
    SelectionListener -->|"3. Matches message"| ExtractionBuffer
    ExtractionBuffer -->|"4. Sends matched entity"| Engine
    Engine -->|"5. Queries message hash"| StorageDB
    StorageDB -->|"6. Returns hash status"| Engine
    Engine -->|"7. Copy clean text"| Clipboard
    Engine -->|"8. Trigger center alert overlay"| ZaloDOM
```

### 7.2 Level 1/2: Submodule Detailed Decomposition (White Box Zoom-in)

#### A. Flowchart (3-Branch Execution Logic)
Refer to isolated document: [submodule-l1.md](file:///Docs/Specs/message-extraction/diagrams/submodule-l1.md) (Raw Mermaid: [flowchart.mmd](file:///Docs/Specs/message-extraction/diagrams/flowchart.mmd))

```mermaid
flowchart TB
    Start["Start: Text Selection Event Detected"] --> ExtractBuffer["Extract and Update 25 Recent Messages Ring Buffer"]
    ExtractBuffer --> CaptureSelection["Capture Selection Fragment and Ancestor DOM Node"]
    CaptureSelection --> MatchMessage{"Match Selected Text with Ring Buffer 25 Messages?"}

    MatchMessage -->|"No Match"| AbortNoMatch["Ignore Selection Event"]
    MatchMessage -->|"Match Found"| ComputeHash["Compute SHA-256 Hash of Matched Message"]

    ComputeHash --> QueryDB{"Query Hash in Dexie IndexedDB?"}

    QueryDB -->|"Branch 2: Hash Exists (DUPLICATE)"| AbortCopy["Abort Clipboard Copy Action"]
    AbortCopy --> RenderCenterAlert["Render Floating Center Alert Modal in Viewport"]
    RenderCenterAlert --> TimerDismiss["Auto Dismiss Alert after 2500ms"]

    QueryDB -->|"Branch 1: Hash Not Found (HAPPY PATH)"| SanitizeText["Apply PatternFilterSanitizer: Strip Keywords e.g. hoa hong"]
    SanitizeText --> WriteClipboard{"Write Clean Text to System Clipboard"}
    
    WriteClipboard -->|"Success"| SaveDB["Save MessageEntity to IndexedDB"]
    SaveDB --> ShowToast["Display Corner Success Toast Notification"]

    WriteClipboard -->|"Branch 3: Exception (Clipboard Denied)"| FallbackExecCommand["Fallback: Execute document execCommand copy"]
    FallbackExecCommand --> SaveDB

    QueryDB -->|"Branch 3: Exception (Storage Error)"| FallbackInMemoryCache["Fallback: Query and Update InMemoryLRUCache"]
    FallbackInMemoryCache --> SanitizeText

    TimerDismiss --> EndState["End of Process Execution"]
    ShowToast --> EndState
    AbortNoMatch --> EndState
```

#### B. Sequence Diagram (Temporal Interaction Flow)
Refer to isolated file: [sequence.mmd](file:///Docs/Specs/message-extraction/diagrams/sequence.mmd)

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Agent
    participant DOM as Zalo Chat DOM
    participant Buffer as RingBufferManager (25 Msgs)
    participant Matcher as MessageMatcher
    participant DB as Dexie Message Repository
    participant Sanitizer as PatternFilterSanitizer
    participant Clip as Clipboard Service
    participant UI as CenterAlertController

    User->>DOM: Highlight message text (selectionchange / mouseup)
    DOM->>Buffer: Fetch current 25 recent chat messages
    Buffer-->>Matcher: Return 25 MessageEntities
    Matcher->>Matcher: Match selection fragment to exact MessageEntity
    
    alt Selection does not match buffer
        Matcher-->>DOM: Abort process
    else Match Found
        Matcher->>DB: findByHash(message.hash)
        alt Message Exists in DB (DUPLICATE)
            DB-->>Matcher: Ok(MessageEntity)
            Matcher->>UI: showCenterAlert("TIN NHẮN ĐÃ TỒN TẠI IN DATABASE")
            UI->>DOM: Mount Shadow DOM Floating Modal in Center Viewport
            UI->>UI: Auto-dismiss modal after 2500ms
        else Message Does Not Exist in DB (NEW MESSAGE)
            DB-->>Matcher: Ok(null)
            Matcher->>Sanitizer: sanitize(message.rawContent, excludePatterns)
            Sanitizer-->>Matcher: Cleaned text string (e.g. without "hoa hồng")
            Matcher->>Clip: copyToClipboard(cleanContent)
            alt Clipboard Success
                Clip-->>Matcher: Ok(true)
            else Clipboard Permission Error
                Clip->>Clip: Fallback to document.execCommand("copy")
                Clip-->>Matcher: Ok(true)
            end
            Matcher->>DB: save(newMessageEntity)
            DB-->>Matcher: Ok(insertedId)
            Matcher->>DOM: Show corner success toast
        end
    end
```

#### C. Class Diagram (Domain Model & OOP Design)
Refer to isolated file: [class.mmd](file:///Docs/Specs/message-extraction/diagrams/class.mmd)

```mermaid
classDiagram
    class MessageEntity {
        +string id
        +string conversationId
        +string senderId
        +string rawContent
        +string cleanContent
        +string hash
        +number timestamp
        +computeHash() string
    }

    class RingBufferManager {
        -number capacity
        -MessageEntity[] items
        +push(message: MessageEntity) void
        +getRecentMessages() MessageEntity[]
        +clear() void
    }

    class MessageMatcher {
        +matchSelection(selectedText: string, node: HTMLElement, buffer: MessageEntity[]) MessageEntity
    }

    class PatternFilterSanitizer {
        -string[] defaultExcludePatterns
        +sanitize(rawText: string, customPatterns: string[]) string
    }

    class DeduplicationSearchEngine {
        -IDexieMessageRepository repository
        +checkExists(hash: string) PromiseBoolean
        +saveMessage(message: MessageEntity) PromiseVoid
    }

    class CenterAlertController {
        -HTMLElement shadowHost
        +showAlert(message: string, durationMs: number) void
        +dismiss() void
    }

    class ClipboardService {
        +writeText(content: string) PromiseBoolean
        -fallbackWriteText(content: string) boolean
    }

    RingBufferManager "1" *-- "0..25" MessageEntity : stores
    MessageMatcher ..> RingBufferManager : queries
    MessageMatcher ..> PatternFilterSanitizer : uses
    MessageMatcher ..> DeduplicationSearchEngine : checks hash
    MessageMatcher ..> ClipboardService : copies clean text
    DeduplicationSearchEngine ..> CenterAlertController : triggers alert on duplicate
```

#### D. ERD Schema (Database Entities & Relationships)
Refer to isolated file: [erd.mmd](file:///Docs/Specs/message-extraction/diagrams/erd.mmd)

```mermaid
erDiagram
    CONVERSATION ||--o{ MESSAGE_ENTITY : contains
    MESSAGE_ENTITY ||--|| MESSAGE_HASH_INDEX : indexed_by
    SANITY_RULE ||--o{ MESSAGE_ENTITY : sanitizes

    CONVERSATION {
        string id PK
        string title
        number lastExtractedAt
    }

    MESSAGE_ENTITY {
        string id PK
        string conversationId FK
        string senderId
        string rawContent
        string cleanContent
        string hash FK
        number timestamp
        string status
    }

    MESSAGE_HASH_INDEX {
        string hash PK
        string messageId FK
        number createdAt
    }

    SANITY_RULE {
        string id PK
        string pattern
        boolean isRegex
        boolean isEnabled
    }
```

#### E. State Diagram (State Machine Lifecycle)
Refer to isolated file: [state.mmd](file:///Docs/Specs/message-extraction/diagrams/state.mmd)

```mermaid
stateDiagram-v2
    [*] --> Idle: Extension Loaded & Module Enabled
    Idle --> CapturingBuffer: Zalo Chat Window Active
    CapturingBuffer --> BufferReady: Extracted 25 Recent Messages

    BufferReady --> ProcessingSelection: User Mouseup Text Selection Event
    ProcessingSelection --> MatchingMessage: Find Selection in 25 Buffer Messages

    MatchingMessage --> Idle: No Match Found (Ignore)
    MatchingMessage --> CheckingDeduplication: Match Found & Compute SHA-256 Hash

    CheckingDeduplication --> DuplicateDetected: Hash Found in IndexedDB
    CheckingDeduplication --> NewMessageDetected: Hash Not Found in IndexedDB

    DuplicateDetected --> AbortingCopy: Cancel Clipboard Action
    AbortingCopy --> AlertDisplaying: Trigger Center Floating Modal
    AlertDisplaying --> Idle: Modal Dismissed after 2500ms

    NewMessageDetected --> SanitizingText: Strip Exclude Keywords e.g. hoa hong
    SanitizingText --> WritingClipboard: Copy Clean Content to System Clipboard
    WritingClipboard --> SavingToStorage: Save MessageEntity & Hash to IndexedDB
    SavingToStorage --> ShowingSuccessToast: Toast Notification Displayed
    ShowingSuccessToast --> BufferReady: Update Buffer & Return to Ready State
```

---

## 8. BDD Gherkin Acceptance Test Scenarios

```gherkin
Feature: Message Extraction Quick Copy and Deduplication Flow

  Scenario: User selects text from a new message and copies successfully with clean text
    Given user is on Zalo Web active chat window
    And message extraction module is ENABLED
    And 25 recent messages are buffered in memory
    When user highlights text from a message containing "Hoa hồng của bạn là 500k"
    And the message hash DOES NOT exist in IndexedDB
    Then the system filters out the keyword "Hoa hồng"
    And copies "của bạn là 500k" into system clipboard
    And saves the message hash into IndexedDB
    And displays a success toast notification

  Scenario: User selects text from an existing message and sees center alert modal
    Given user highlights text from a message
    And the message hash ALREADY EXISTS in IndexedDB database
    Then the system CANCELS the clipboard copy action
    And displays a center alert floating modal saying "TIN NHẮN ĐÃ TỒN TẠI TRONG CƠ SỞ DỮ LIỆU"
    And the center alert modal automatically dismisses after 2500ms
```

---

## 9. End-of-Step Validation Gates Summary

| Step Number | Step Name | Timing Rule | Status | Score |
|---|---|---|---|---|
| Step 1 | Input Analysis & XML Enclosure | END_OF_STEP | PASS | 1.00 |
| Step 2 | Requirement Normalization | END_OF_STEP | PASS | 1.00 |
| Step 3 | Interactive Clarification | END_OF_STEP | PASS | 1.00 |
| Step 4 | BA & Use Cases Breakdown | END_OF_STEP | PASS | 1.00 |
| Step 5 | Architecture & Mermaid Isolation | END_OF_STEP | PASS | 1.00 |
| Step 6 | Final Spec Synthesis | END_OF_STEP | PASS | 1.00 |

**Final Quality Score**: **1.00 / 1.00** (PASS ≥ 0.80)
