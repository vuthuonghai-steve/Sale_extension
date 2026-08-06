# 📐 Đặc tả Kỹ thuật Module Chuẩn hóa Dữ liệu (Data Cleaner Specification)

Tài liệu này đặc tả chi tiết kiến trúc, mô hình dữ liệu, quy trình xử lý và hợp đồng kỹ thuật của module **Data Cleaner** (`utils/data-cleaner`) thuộc dự án **WXT Chrome MV3 Extension (filter_data)**.

---

## 🎯 1. Tổng quan & Mục đích Kiến trúc

Module **Data Cleaner** đóng vai trò là lõi xử lý dữ liệu trung gian (Data Processing Layer). Nhiệm vụ chính là tiếp nhận các khối dữ liệu thô (`RawRecord[]` / Text thô từ Zalo/Social/Scraper) và thực hiện pipeline biến đổi qua nhiều công đoạn để tạo ra dữ liệu sạch (`CleanListingRecord[]`) với cấu trúc định dạng chuẩn hóa, sẵn sàng cho việc lưu trữ vào IndexedDB/Dexie và phân tích ở downstream.

### Nguyên tắc thiết kế cốt lõi:
1. **Pipeline & Interceptor Pattern:** Cho phép gắn nối tiếp, bật/tắt hoặc mở rộng các bước xử lý độc lập.
2. **Immutability & Pure Transformation:** Dữ liệu đi qua mỗi step không làm ảnh hưởng trực tiếp đến trạng thái toàn cục (side-effect free).
3. **Robust Error Tolerance & Metrics:** Thu thập báo cáo thực thi (`CleaningReport`) chính xác bao gồm thời gian chạy, số lượng bản ghi bị lọc và danh sách lỗi phát sinh.

---

## 🏗️ 2. Sơ đồ Kiến trúc & Luồng Xử lý (Mermaid Diagrams)

### 2.1. Biểu đồ Tổng quan Pipeline (Flowchart)

Luồng chuyển đổi dữ liệu thô qua 6 bước (steps) trong `DataCleanerManager`:

```mermaid
flowchart TD
    RawInput["Input: Raw Text / Zalo Messages / Scraped Records"] --> Manager[DataCleanerManager]
    
    subgraph PipelineExecution ["Pipeline làm sạch dữ liệu (Data Cleaner Pipeline)"]
        direction TB
        Step1["1. PostSplitterStep\n- Tách bài đăng theo Zalo Header / Mã H / 🌹"]
        Step2["2. SanitizerStep\n- Xóa ký tự rác / Unescape HTML / Normal whitespace"]
        Step3["3. ListingParserStep\n- Extract Regex: Mã QL, Hoa hồng, Giá, Địa chỉ, Loại phòng\n- Tách Multi-tier rooms"]
        Step4["4. NormalizerStep\n- Ánh xạ 12 Quận/Huyện Hà Nội theo Landmark\n- Parse Phí dịch vụ & Quy định chính sách"]
        Step5["5. FilterStep\n- Lọc bản ghi rác / Không hợp lệ / Dưới ngưỡng giá"]
        Step6["6. DeduplicateStep\n- Tạo Fingerprint Hash: Address | RoomType | Price\n- Lọc trùng lặp"]

        Step1 --> Step2 --> Step3 --> Step4 --> Step5 --> Step6
    end

    Manager --> PipelineExecution
    PipelineExecution --> OutputData["CleanListingRecord[]"]
    PipelineExecution --> OutputReport["CleaningReport\n- Stats, Execution Time, Errors"]
```

---

### 2.2. Biểu đồ Tuần tự Chi tiết (Sequence Diagram)

Quy trình tương tác giữa Caller, Manager, các Processing Steps và Data Contracts:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Caller / Extension Entrypoint
    participant Manager as DataCleanerManager
    participant Step as ICleaningStep (Pipeline Steps)
    participant Report as CleaningReport

    Client->>Manager: cleanRawText(rawText) / process(rawData, options)
    Manager->>Manager: Khởi tạo Pipeline & Timer (performance.now())

    loop Lặp qua từng Cleaning Step (nếu enabled = true)
        Manager->>Step: execute(currentData, options)
        activate Step
        alt Xử lý thành công
            Step-->>Manager: Return transformed data
        else Phát sinh ngoại lệ / Lỗi
            Step-->>Manager: Catch Exception
            Manager->>Report: Ghi nhận error (stepName, errorMsg)
        end
        deactivate Step
        Manager->>Manager: Tính toán executionTimeMs & filteredCount
    end

    Manager->>Manager: Tổng hợp dữ liệu CleanListingRecord[] & CleaningReport
    Manager-->>Client: { data: CleanListingRecord[], report: CleaningReport }
```

---

### 2.3. Mô hình Lớp Domain (Class Diagram)

Mối quan hệ giữa Core Manager, Base Step và các bước mở rộng:

```mermaid
classDiagram
    class ICleaningStep~TIn, TOut~ {
        <<interface>>
        +string name
        +boolean enabled
        +execute(input: TIn, options?: CleaningOptions) TOut
    }

    class BaseCleaningStep~TIn, TOut~ {
        <<abstract>>
        +string name
        +boolean enabled
        +enable() void
        +disable() void
        +execute(input: TIn, options?: CleaningOptions)* TOut
    }

    class DataCleanerManager {
        -ICleaningStep[] pipeline
        +addStep(step: ICleaningStep) this
        +removeStep(stepName: string) boolean
        +getSteps() ICleaningStep[]
        +clearSteps() void
        +process(rawData: RawRecord[], options?: CleaningOptions) Promise~ProcessResult~
    }

    class PostSplitterStep {
        +name: "PostSplitterStep"
        +execute(input: RawRecord[] | string) RawRecord[]
    }

    class SanitizerStep {
        +name: "SanitizerStep"
        +execute(input: RawRecord[]) RawRecord[]
    }

    class ListingParserStep {
        +name: "ListingParserStep"
        +execute(input: RawRecord[]) CleanListingRecord[]
        -parseBaseFields() CleanListingRecord
        -extractMultiTierRooms() RoomTierInfo[]
    }

    class NormalizerStep {
        +name: "NormalizerStep"
        +execute(input: CleanListingRecord[]) CleanListingRecord[]
        -normalizeDistrict(address, rawText) string
        -parseUtilityFees(rawText) UtilityFees
        -parsePolicies(rawText) PolicyRules
    }

    class FilterStep {
        +name: "FilterStep"
        +execute(input: CleanListingRecord[]) CleanListingRecord[]
    }

    class DeduplicateStep {
        +name: "DeduplicateStep"
        +execute(input: CleanListingRecord[]) CleanListingRecord[]
        -computeFingerprintHash(record) string
    }

    ICleaningStep <|.. BaseCleaningStep
    BaseCleaningStep <|-- PostSplitterStep
    BaseCleaningStep <|-- SanitizerStep
    BaseCleaningStep <|-- ListingParserStep
    BaseCleaningStep <|-- NormalizerStep
    BaseCleaningStep <|-- FilterStep
    BaseCleaningStep <|-- DeduplicateStep
    DataCleanerManager o-- ICleaningStep : contains pipeline
```

---

### 2.4. Sơ đồ Thực thể Dữ liệu Dịch vụ (ERD / Data Contract)

Cấu trúc các Interface chính trong `types.ts`:

```mermaid
erDiagram
    RAW_RECORD ||--o{ CLEAN_LISTING_RECORD : "Chuyển đổi từ"
    CLEAN_LISTING_RECORD ||--o| UTILITY_FEES : "Chứa phí dịch vụ"
    CLEAN_LISTING_RECORD ||--o| POLICY_RULES : "Chứa quy định"
    CLEANING_REPORT ||--o{ STEP_LOG : "Chứa nhật ký từng step"

    RAW_RECORD {
        string rawText
        number sourceLineStart
        number sourceLineEnd
    }

    CLEAN_LISTING_RECORD {
        string id PK
        string managerCode
        string commission
        string address
        string district
        string roomType
        number priceVnd
        number priceMaxVnd
        number areaSqm
        string availableDate
        boolean isFull
        string fingerprintHash
        string rawRef
    }

    UTILITY_FEES {
        number electricityPerKwh
        number waterPerM3
        number waterPerPerson
        number internetPerRoom
        number internetPerPerson
        number generalServicePerPerson
        number generalServicePerRoom
    }

    POLICY_RULES {
        boolean allowPet
        boolean allowElectricVehicle
        boolean allowForeigner
        number maxOccupants
        number maxVehicles
    }

    CLEANING_REPORT {
        string timestamp
        number totalInputRecords
        number totalOutputRecords
        number droppedRecordsCount
        number totalExecutionTimeMs
    }

    STEP_LOG {
        string stepName
        number processedCount
        number filteredCount
        number executionTimeMs
    }
```

---

## 📋 3. Chi tiết Kỹ thuật Các Bước trong Pipeline

| STT | Bước (Step) | Input | Output | Trách nhiệm chính |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `PostSplitterStep` | `RawRecord[]` / `string` | `RawRecord[]` | Nhận text thô dài (ví dụ xuất tin Zalo), tách thành từng bài đăng riêng dựa trên Zalo Header pattern `[HH:mm, DD/MM/YYYY]`, biểu tượng `🌹` hoa hồng, hoặc mã quản lý `Hxxx`. |
| 2 | `SanitizerStep` | `RawRecord[]` | `RawRecord[]` | Làm sạch chuỗi: loại bỏ HTML tags, unescape các thực thể HTML (`&amp;`, `&lt;`), chuyển đổi các khoảng trắng trùng lặp. |
| 3 | `ListingParserStep` | `RawRecord[]` | `CleanListingRecord[]` | Sử dụng Regex bóc tách các trường: Hoa hồng, Mã quản lý, Địa chỉ, Diện tích, Giá thuê, Ngày trống. Xử lý bài đăng **Multi-tier** (nhiều khoảng giá / nhiều loại phòng trong 1 bài) thành các bản ghi riêng lẻ. |
| 4 | `NormalizerStep` | `CleanListingRecord[]` | `CleanListingRecord[]` | Chuẩn hóa Quận/Huyện dựa trên từ điển 12 Quận Hà Nội & Dictionary Landmark (mapping tên đường như *Đình Thôn* $\rightarrow$ *Nam Từ Liêm*). Phân tích Phí dịch vụ (Điện, Nước, Dịch vụ) & Quy định (Nuôi mèo/Pet, Xe điện). |
| 5 | `FilterStep` | `CleanListingRecord[]` | `CleanListingRecord[]` | Loại bỏ các bản ghi không đạt yêu cầu: Bản ghi rác, bản ghi thiếu thông tin cốt lõi (không có giá và không có địa chỉ), hoặc bản ghi có mức giá bất thường. |
| 6 | `DeduplicateStep` | `CleanListingRecord[]` | `CleanListingRecord[]` | Tính toán chuỗi Fingerprint Hash dựa trên công thức `address_clean|room_type|price`. Khử các bản ghi trùng lặp trong cùng batch. |

---

## 🛠️ 4. Quy trình Mở rộng Module (Developer & Agent Guide)

Để mở rộng module Data Cleaner với một bước xử lý mới:

1. **Tạo Step Class:**
   Tạo file mới tại `utils/data-cleaner/steps/<kebab-case>-step.ts`. Kế thừa `BaseCleaningStep<TIn, TOut>`.
2. **Cài đặt logic `execute`:**
   ```typescript
   export class CustomAnalysisStep extends BaseCleaningStep<CleanListingRecord[], CleanListingRecord[]> {
     public readonly name = 'CustomAnalysisStep';
     public execute(input: CleanListingRecord[], options?: CleaningOptions): CleanListingRecord[] {
       if (!this.enabled) return input;
       // Logic xử lý biến đổi dữ liệu tại đây
       return input;
     }
   }
   ```
3. **Đăng ký vào Manager / Barrel Export:**
   Thêm bước mới vào `DataCleanerManager` hoặc export trong `utils/data-cleaner/index.ts`.

---

## 🧪 5. Kiểm thử & Đảm bảo Chất lượng (Quality Gate)

Mọi thay đổi trong module này phải vượt qua kiểm tra cơ học của TypeScript Compiler:
```bash
npm run compile
```

Không sử dụng kiểu `any` tùy tiện, tuân thủ nghiêm ngặt data contract được định nghĩa trong `types.ts`.
