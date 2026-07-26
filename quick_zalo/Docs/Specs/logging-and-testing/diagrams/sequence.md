---
title: "Temporal Component Interaction Sequence Diagram: logging-and-testing"
diagram_type: "Sequence Diagram"
architecture_level: "1/2"
view_mode: "Temporal Component Interactions"
parent_diagram: "submodule-decomposition.md"
parent_node_id: "Node1_WhiteBox"
feature_name: "logging-and-testing"
version: "1.0.0"
last_updated: "2026-07-27"
---

# Temporal Component Interaction Sequence Diagram: logging-and-testing

> [!NOTE]
> Sơ đồ Sequence tương tác trình tự thời gian giữa **Entrypoint (App Component)**, **Logger (Evlog Facade)**, **Result<T,E> Handler**, **IndexedDBAdapter**, **DevTools Console**, và **LLM Agent**. Sơ đồ minh họa trình tự truyền nhận thông điệp, các khối điều khiển `alt/else`, `par/and`, và `opt`.

---

## 1. Ngữ cảnh & Phạm vi Nghiệp vụ
- **Mục tiêu**: Mô tả chính xác thứ tự thời gian của thao tác phát sinh log, kiểm tra Result<T,E>, ghi log song song và quy trình đọc log audit của LLM Agent.
- **Tác nhân tham gia (Actors)**: `AppEntry` (Extension Component), `ResultHandler` (Result Pattern), `Logger` (Evlog Engine), `IndexedDBAdapter` (Ring Buffer Storage), `DevToolsConsole` (Console View), `LLMAgent` (Autonomous Audit Agent).
- **Ranh giới xử lý**: Trình tự thời gian thời lượng microsecond/millisecond trong Extension Runtime.

---

## 2. Sơ đồ Mermaid

```mermaid
---
config:
  theme: default
  look: classic
---
sequenceDiagram
    autonumber
    actor AppEntry as "App Component Entrypoint"
    participant ResultHandler as "Result~T,E~ Exception Handler"
    participant Logger as "Evlog Facade & Validator"
    participant Dispatcher as "Dual Transport Dispatcher"
    participant IndexedDBAdapter as "IndexedDB FIFO Ring Buffer"
    participant DevToolsConsole as "DevTools Console"
    actor LLMAgent as "LLM Agent (Autonomous AI)"

    %% Step 1: Component calls action wrapped in Result
    AppEntry->>+ResultHandler: "Execute Async Action wrapped in Result~T,E~"
    
    alt "Trường hợp 1: Action thực thi thành công (Ok Path)"
        ResultHandler-->>AppEntry: "Return Ok(value)"
        AppEntry->>+Logger: "Evlog.info('Action Succeeded', { metadata })"
        
        Logger->>Logger: "Validate Schema & Attach Correlation ID"
        Logger->>+Dispatcher: "Dispatch Validated Log Entry"
        
        par "Dual Transport Parallel Emission"
            Dispatcher->>DevToolsConsole: "Format ANSI & Output Stream"
        and "Ghi Persistence Async"
            Dispatcher->>+IndexedDBAdapter: "Write Entry to ObjectStore"
            
            opt "Storage Capacity Reaches Threshold (Capacity >= 5000)"
                IndexedDBAdapter->>IndexedDBAdapter: "Trigger FIFO Eviction (Delete Oldest 500 Records)"
            end
            
            IndexedDBAdapter-->>-Dispatcher: "Confirm Transaction Success"
        end
        
        Dispatcher-->>-Logger: "Dispatch Complete"
        Logger-->>-AppEntry: "Void Return"

    else "Trường hợp 2: Action thất bại hoặc throw Exception (Err Path)"
        ResultHandler->>ResultHandler: "Catch Unhandled Error & Extract Stack Trace"
        ResultHandler-->>AppEntry: "Return Err(SystemError)"
        
        AppEntry->>+Logger: "Evlog.error('Action Failed', { errorDetails, stackTrace })"
        Logger->>Logger: "Synthesize Error Payload (Level ERROR/FATAL)"
        Logger->>+Dispatcher: "Dispatch Error Log Entry"
        
        par "Dual Transport Error Emission"
            Dispatcher->>DevToolsConsole: "Output Styled Error Box (Red Format)"
        and "Urgent Storage Write"
            Dispatcher->>+IndexedDBAdapter: "Write Error Record to IndexedDB"
            IndexedDBAdapter-->>-Dispatcher: "Confirm Transaction Success"
        end
        
        Dispatcher-->>-Logger: "Dispatch Complete"
        Logger-->>-AppEntry: "Void Return"
    end

    %% Step 2: Audit Inspection by LLM Agent
    opt "LLM Agent thực hiện Audit / Chẩn đoán lỗi"
        LLMAgent->>+IndexedDBAdapter: "Query Log Entries (WHERE level = 'ERROR' AND timestamp > T1)"
        IndexedDBAdapter-->>-LLMAgent: "Return Array of AgenticLogEntry Objects"
        LLMAgent->>LLMAgent: "Parse Stack Trace & Generate Diagnostic Hypothesis"
    end
```

---

## 3. Hợp đồng Dữ liệu Ranh giới (Data Contracts)

### 3.1. Dữ liệu Đầu vào (Inputs / Triggers)
| ID | Tên Trực quan | Nguồn phát | Schema DTO / Payload | Ràng buộc / Rules |
| :--- | :--- | :--- | :--- | :--- |
| `SEQ-IN-01` | Async Action Call | AppEntry | `() => Promise<T>` | Được bọc trong try/catch của ResultHandler. |
| `SEQ-IN-02` | Evlog Emission | AppEntry | `(msg: string, meta?: object) => void` | Format chuỗi không bị rỗng. |

### 3.2. Dữ liệu Đầu ra (Outputs / Responses)
| ID | Tên Phản hồi | Đích nhận | Schema DTO / Payload | Trạng thái Trả về |
| :--- | :--- | :--- | :--- | :--- |
| `SEQ-OUT-01` | Result Container | AppEntry | `Ok<T>` hoặc `Err<E>` | Khóa kiểu nhị phân, không throw exception. |
| `SEQ-OUT-02` | Query Results | LLMAgent | `AgenticLogEntry[]` | Danh sách đối tượng log đã lọc theo thời gian. |

---

## 4. Kho Dữ liệu & Quản lý Trạng thái (Data Stores & State)
| ID Kho | Tên Kho Dữ liệu | Loại Storage | Entity / Schema Key | Giao thức / Thao tác |
| :--- | :--- | :--- | :--- | :--- |
| `DS-SEQ-01` | `agentic_logs` | IndexedDB Object Store | `AgenticLogEntry` | Async Transaction & Range Query |

---

## 5. Xử lý Ngoại lệ & Kịch bản Lỗi (Exception Handling)
| Mã Lỗi | Kịch bản Lỗi / Trigger | Luồng Xử lý Phục hồi (Recovery Flow) | Trạng thái Cuối cùng |
| :--- | :--- | :--- | :--- |
| `ERR-SEQ-01` | IndexedDB Write Timeout | Timeout 1000ms, tự động log warning out console & cancel transaction | Transaction Aborted safely |

---

## 6. Giải thích Lý do Thiết kế & Phân rã (Architecture & Rationale)
- **Lý do phân rã**: Bóc tách chi tiết thứ tự thời gian cho thấy chính xác điểm bắt lỗi của Result Pattern trước khi thông điệp log được gửi tới Logger, loại bỏ hoàn toàn khả năng văng exception chưa xử lý.
- **Đánh đổi Kiến trúc (Trade-offs)**: Sử dụng các khối `par` (Parallel) để ghi dữ liệu song song giúp giảm đáng kể thời gian chờ (latency) của caller context xuống dưới 1ms.
