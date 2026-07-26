---
title: "Domain Entity & Class Diagram: logging-and-testing"
diagram_type: "Class Diagram"
architecture_level: 2
view_mode: "Domain Model & Class Architecture"
parent_diagram: "submodule-decomposition.md"
parent_node_id: "Node1_WhiteBox"
feature_name: "logging-and-testing"
version: "1.0.0"
last_updated: "2026-07-27"
---

# Domain Entity & Class Diagram: logging-and-testing

> [!NOTE]
> Sơ đồ Class Diagram thể hiện thiết kế hướng đối tượng (OOP Domain Model) cho hạ tầng Observability & Testing. Sơ đồ mô hình hóa các lớp cốt lõi (`Evlog`, `AgenticLogEntry`, `Result~T,E~`, `IndexedDBAdapter`, `LogFormatter`, `ConsoleTransport`). Cú pháp Generics sử dụng tilde đơn `~T~` theo đúng chuẩn Mermaid syntax, tuyệt đối không lồng 2 cấp tilde.

---

## 1. Ngữ cảnh & Phạm vi Nghiệp vụ
- **Mục tiêu**: Định nghĩa các Interface, Abstract Classes, Data Entities, Value Objects và các mối quan hệ kế thừa (`extends`), thực thi (`implements`), sở hữu (`composition`) và phụ thuộc (`dependency`).
- **Tác nhân tham gia (Actors)**: Developer, Extension Core Modules, Class Design Architecture.
- **Ranh giới xử lý**: Codebase Architecture Level (TypeScript Domain Classes).

---

## 2. Sơ đồ Mermaid

```mermaid
---
config:
  theme: default
  look: classic
---
classDiagram
    %% Core Facade Class
    class Evlog {
        +LogLevel minLevel
        -List~ILogTransport~ transports
        +info(message: string, meta: object) void
        +warn(message: string, meta: object) void
        +error(message: string, error: Error) void
        +debug(message: string, meta: object) void
        +registerTransport(transport: ILogTransport) void
        +setLogLevel(level: LogLevel) void
    }

    %% Result Pattern Generic Class (Single Tilde Generic Syntax)
    class Result~T,E~ {
        +bool isOk
        +bool isErr
        -T value
        -E error
        +ok(val: T)$ Result~T,E~
        +err(err: E)$ Result~T,E~
        +unwrap() T
        +unwrapOr(fallback: T) T
        +map(fn: Function) Result~T,E~
    }

    %% Log Entry Entity
    class AgenticLogEntry {
        +string id
        +number timestamp
        +LogLevel level
        +string category
        +string message
        +string payloadJson
        +string correlationId
        +string stackTrace
        +toJSON() string
        +fromRawPayload(raw: object)$ AgenticLogEntry
    }

    %% Interfaces
    class ILogTransport {
        <<interface>>
        +name: string
        +dispatch(entry: AgenticLogEntry) Promise~bool~
    }

    class IStorageAdapter {
        <<interface>>
        +save(entry: AgenticLogEntry) Promise~void~
        +query(filter: object) Promise~AgenticLogEntry[]~
        +evictOldest(count: number) Promise~number~
    }

    %% Concrete Implementations
    class ConsoleTransport {
        +name: string
        -LogFormatter formatter
        +dispatch(entry: AgenticLogEntry) Promise~bool~
    }

    class IndexedDBTransport {
        +name: string
        -IndexedDBAdapter adapter
        +dispatch(entry: AgenticLogEntry) Promise~bool~
    }

    class IndexedDBAdapter {
        -string dbName
        -int maxCapacity
        +save(entry: AgenticLogEntry) Promise~void~
        +query(filter: object) Promise~AgenticLogEntry[]~
        +evictOldest(count: number) Promise~number~
        -checkQuotaAndEvict() Promise~void~
    }

    class LogFormatter {
        +formatConsoleStyle(entry: AgenticLogEntry) string
        +sanitizePII(meta: object) object
        +truncateStackTrace(stack: string) string
    }

    %% Enum
    class LogLevel {
        <<enumeration>>
        DEBUG
        INFO
        WARN
        ERROR
        FATAL
    }

    %% Class Relationships
    Evlog "1" *-- "1..*" ILogTransport : "manages active transports"
    Evlog ..> LogLevel : "uses log level"
    Evlog ..> AgenticLogEntry : "creates and validates"

    ILogTransport <|.. ConsoleTransport : "implements"
    ILogTransport <|.. IndexedDBTransport : "implements"

    ConsoleTransport "1" --> "1" LogFormatter : "uses for formatting"
    IndexedDBTransport "1" --> "1" IndexedDBAdapter : "delegates persistence to"
    IStorageAdapter <|.. IndexedDBAdapter : "implements"

    IndexedDBAdapter "1" *-- "0..*" AgenticLogEntry : "persists ring entries"
    Evlog ..> Result~T,E~ : "wraps failure execution outcomes"
```

---

## 3. Hợp đồng Dữ liệu Ranh giới (Data Contracts)

### 3.1. Dữ liệu Đầu vào (Inputs / Triggers)
| ID | Tên Trực quan | Nguồn phát | Schema DTO / Payload | Ràng buộc / Rules |
| :--- | :--- | :--- | :--- | :--- |
| `CLS-IN-01` | Method Invocations | App Domain | `(message: string, meta?: object)` | String message không rỗng. |

### 3.2. Dữ liệu Đầu ra (Outputs / Responses)
| ID | Tên Phản hồi | Đích nhận | Schema DTO / Payload | Trạng thái Trả về |
| :--- | :--- | :--- | :--- | :--- |
| `CLS-OUT-01` | Class Instance | Factory / Caller | `Result<T,E>` | Đối tượng Result không mutable. |

---

## 4. Kho Dữ liệu & Quản lý Trạng thái (Data Stores & State)
| ID Kho | Tên Kho Dữ liệu | Loại Storage | Entity / Schema Key | Giao thức / Thao tác |
| :--- | :--- | :--- | :--- | :--- |
| `DS-CLS-01` | Private Class State | In-Memory RAM | `Evlog.transports` | Static Collection |

---

## 5. Xử lý Ngoại lệ & Kịch bản Lỗi (Exception Handling)
| Mã Lỗi | Kịch bản Lỗi / Trigger | Luồng Xử lý Phục hồi (Recovery Flow) | Trạng thái Cuối cùng |
| :--- | :--- | :--- | :--- |
| `ERR-CLS-01` | `unwrap()` gọi trên `Result Err` | Ném ra `ResultUnwrapError` có kèm theo cause error gốc | Controlled Crash with Diagnostics |

---

## 6. Giải thích Lý do Thiết kế & Phân rã (Architecture & Rationale)
- **Lý do phân rã**: Áp dụng nguyên lý Dependency Inversion Principle (DIP) của SOLID: `Evlog` phụ thuộc vào Interface `ILogTransport` thay vì phụ thuộc trực tiếp vào `IndexedDBAdapter`. Điều này giúp việc bổ sung các transport mới (ví dụ `RemoteHttpTransport`) trở nên cực kỳ linh hoạt mà không cần sửa đổi core code.
- **Đánh đổi Kiến trúc (Trade-offs)**: Sử dụng Mẫu `Result<T,E>` đòi hỏi mã nguồn ở mọi nơi phải kiểm tra `.isOk` hoặc `.isErr` trước khi truy cập dữ liệu, loại bỏ hoàn toàn `NullPointerException` và `Unhandled Exception` rủi ro.
