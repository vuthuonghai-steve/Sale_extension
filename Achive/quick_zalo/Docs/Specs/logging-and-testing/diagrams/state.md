---
title: "Log Entry Lifecycle & Ring Buffer State Diagram: logging-and-testing"
diagram_type: "State Diagram"
architecture_level: 2
view_mode: "State Machine & Lifecycle"
parent_diagram: "submodule-decomposition.md"
parent_node_id: "Sub13"
feature_name: "logging-and-testing"
version: "1.0.0"
last_updated: "2026-07-27"
---

# Log Entry Lifecycle & Ring Buffer State Diagram: logging-and-testing

> [!NOTE]
> Sơ đồ máy trạng thái (State Diagram) mô tả hai vòng đời cốt lõi: (1) Vòng đời chuyển hóa của một **Log Entry** từ khi khởi tạo đến khi bị hủy bởi FIFO, và (2) Máy trạng thái quản lý dung lượng của **IndexedDB FIFO Ring Buffer** (Normal -> Warning -> Eviction -> Degraded).

---

## 1. Ngữ cảnh & Phạm vi Nghiệp vụ
- **Mục tiêu**: Định nghĩa toàn bộ các trạng thái khả dĩ, các sự kiện chuyển trạng thái (State Transitions), điều kiện bảo vệ (Guards) và hành vi phản hồi của bộ đệm ghi đè.
- **Tác nhân tham gia (Actors)**: `Evlog Engine`, `IndexedDBAdapter`, `FIFO Ring Buffer Manager`.
- **Ranh giới xử lý**: State Machine Engine trong Memory & Local Storage.

---

## 2. Sơ đồ Mermaid

```mermaid
---
config:
  theme: default
  look: classic
---
stateDiagram-v2
    %% SECTION 1: LOG ENTRY LIFECYCLE STATE MACHINE
    [*] --> Created: "Evlog method invoked by App"

    state Created {
        [*] --> RawPayloadCaptured
        RawPayloadCaptured --> Sanitized: "PII Scrubbing Completed"
        Sanitized --> SchemaValidated: "Schema Rules Verified"
    }

    Created --> Validated: "Passed validation guard"
    Created --> DiscardedInvalid: "Schema invalid / Payload > 64KB"

    Validated --> Dispatched: "Accepted by Dual Transport"
    Validated --> FilteredOut: "Level below min_threshold"

    state Dispatched {
        [*] --> StreamedToConsole: "DevTools Console Write"
        [*] --> QueuedForStorage: "IndexedDB Adapter Queue"
    }

    Dispatched --> PersistedInStore: "Transaction committed to IndexedDB"
    Dispatched --> StoredInMemoryFallback: "QuotaExceeded Error captured"

    PersistedInStore --> EvictedByFIFO: "Buffer reaches MAX_CAPACITY (FIFO deletion)"
    StoredInMemoryFallback --> MemoryCleared: "Browser restart / Flush event"

    EvictedByFIFO --> [*]
    MemoryCleared --> [*]
    DiscardedInvalid --> [*]
    FilteredOut --> [*]

    %% SECTION 2: RING BUFFER CAPACITY STATE MACHINE
    state RingBufferCapacityManager {
        [*] --> NormalState: "Capacity < 80% MAX"
        
        NormalState --> WarningState: "Capacity >= 80% MAX"
        WarningState --> NormalState: "Log entries pruned manually"
        
        WarningState --> EvictionState: "Capacity >= 100% MAX_CAPACITY"
        
        state EvictionState {
            [*] --> LocatingOldestEntries
            LocatingOldestEntries --> DeletingFIFOChunk: "Delete oldest N (10%) records"
            DeletingFIFOChunk --> UpdatingBufferMetadata
        }

        EvictionState --> NormalState: "Capacity restored below 90%"
        
        NormalState --> DegradedMemoryState: "IndexedDB QuotaExceededError"
        WarningState --> DegradedMemoryState: "IndexedDB Storage Blocked"
        
        DegradedMemoryState --> NormalState: "Storage Quota Reset / DB Re-opened"
    }
```

---

## 3. Hợp đồng Dữ liệu Ranh giới (Data Contracts)

### 3.1. Dữ liệu Đầu vào (Inputs / Triggers)
| ID | Tên Trực quan | Nguồn phát | Schema DTO / Payload | Ràng buộc / Rules |
| :--- | :--- | :--- | :--- | :--- |
| `STA-IN-01` | State Transition Event | Buffer Engine | `{ event: "ENTRY_ADDED", currentSize: number }` | Trình tự thời gian đơn điệu. |

### 3.2. Dữ liệu Đầu ra (Outputs / Responses)
| ID | Tên Phản hồi | Đích nhận | Schema DTO / Payload | Trạng thái Trả về |
| :--- | :--- | :--- | :--- | :--- |
| `STA-OUT-01` | State Change Notification | Observability Monitor | `{ previousState: string, newState: string }` | State Enum hợp lệ. |

---

## 4. Kho Dữ liệu & Quản lý Trạng thái (Data Stores & State)
| ID Kho | Tên Kho Dữ liệu | Loại Storage | Entity / Schema Key | Giao thức / Thao tác |
| :--- | :--- | :--- | :--- | :--- |
| `DS-STA-01` | `buffer_state` | IndexedDB Object Store | `LogBufferState` | Atomic Update |

---

## 5. Xử lý Ngoại lệ & Kịch bản Lỗi (Exception Handling)
| Mã Lỗi | Kịch bản Lỗi / Trigger | Luồng Xử lý Phục hồi (Recovery Flow) | Trạng thái Cuối cùng |
| :--- | :--- | :--- | :--- |
| `ERR-STA-01` | Deadlock during Eviction State | Abort transaction & Force transition to DegradedMemoryState | DegradedMemoryState |

---

## 6. Giải thích Lý do Thiết kế & Phân rã (Architecture & Rationale)
- **Lý do phân rã**: Phân rã máy trạng thái cho phép tách bạch rõ ràng giữa logic biến đổi từng log entry cá thể và trạng thái quản lý dung lượng tổng thể của Ring Buffer, giúp ngăn ngừa triệt để lỗi tràn bộ nhớ trên trình duyệt.
- **Đánh đổi Kiến trúc (Trade-offs)**: Tự động chuyển sang `DegradedMemoryState` giúp ứng dụng không bao giờ crash kể cả khi đĩa cứng của người dùng bị đầy.
