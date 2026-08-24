# 🧠 BẢN ĐỒ TƯ DUY & DANH SÁCH PHỤ THUỘC: MODULE MESSAGE FILTER REGEX

- **Tệp tài liệu**: `Docs/Maps/01_Message_Filter_Regex_Mindmap.md`
- **Hệ thống**: Windows Native Desktop C# .NET 6.0 (`app_forms`)
- **Kiến trúc**: Clean 3-Layer Architecture & Component-Driven Pipeline
- **Mục đích**: Cung cấp bức tranh toàn cảnh về cách module lọc tin nhắn và regex được quản lý, phân tầng, thứ tự ưu tiên, danh sách phụ thuộc và quy trình chuẩn khi cần bảo trì/thêm mới Regex.

---

## 1. 🗺️ MINDMAP TỔNG THỂ HỆ THỐNG MESSAGE FILTER

```mermaid
mindmap
  root((Message Filter Engine))
    0_Shared Foundation
      ClipboardDataPayload["ClipboardDataPayload (Raw, Cleaned, Timestamp)"]
      FilterPipelineOptions["FilterPipelineOptions (Bật/Tắt từng SubFilter, MaxLimit)"]
      FilterExecutionReport["FilterExecutionReport (Hiệu năng, Bộ lọc áp dụng)"]
      FilterEnums["FilterEnums (FilterType, ExecutionState)"]
    1_Backend Engine
      Contracts
        IClipboardFilter["IClipboardFilter (Name, Priority, Process, IsEnabled)"]
        IFilterPipelineOrchestrator["IFilterPipelineOrchestrator"]
      Pipeline Manager
        ClipboardPipelineManager["ClipboardPipelineManager (Normalize, Điều phối chuỗi)"]
        PipelineOrchestratorService["PipelineOrchestratorService (Lắng nghe ngầm, Telemetry)"]
      Sub-Filters Pipeline
        1 UnicodeSanitizerFilter["P1: UnicodeSanitizerFilter (FormC, Zero-width, HTML)"]
        2 ReplyQuoteFilter["P2: ReplyQuoteFilter (Dọn Quote Zalo/Telegram/Mess)"]
        3 ZaloStickerFilter["P3: ZaloStickerFilter (Mã sticker, System tags, Separator)"]
        4 BrandRegexFilter["P4: BrandRegexFilter (Thương hiệu TL House, Footer nguồn hàng)"]
        5 CommissionRegexFilter["P5: CommissionRegexFilter (Hoa hồng, HĐ, Thưởng, Bonus)"]
        6 UrlSanitizerFilter["P6: UrlSanitizerFilter (Lọc/chuẩn hóa URL ngoài luồng)"]
      Regex Catalog
        Sub-Patterns["Sub-Patterns (Emoji, Keyword, Duration, Percent, Money, Month)"]
        Compiled Regexes["Compiled Regexes (ReDoS Timeout 250ms, CultureInvariant)"]
      Win32 Adapter
        Win32ClipboardListenerAdapter["Win32 Clipboard Hook (WM_CLIPBOARDUPDATE)"]
    2_Frontend Presentation
      MessageCleanerScreen["MessageCleanerScreen (Root Screen <= 150 dòng)"]
      MessageCleanerStateHook["MessageCleanerStateHook (Quản lý State & Event)"]
      Components
        FilterToggleSwitchPanelComponent["FilterToggleSwitchPanel (Bật/Tắt Rules)"]
        LiveClipboardPreviewComponent["LiveClipboardPreview (So sánh Trước/Sau)"]
        PipelineExecutionLogComponent["PipelineExecutionLog (Lịch sử xử lý)"]
    Tests Suite
      CommissionRegexFilterTests["CommissionRegexFilterTests (Unit Tests Regex độc lập)"]
      PipelineTests["PipelineTests (32+ Integration Test Cases tin nhắn thật)"]
      FilterOptionsToggleTests["FilterOptionsToggleTests (Kiểm thử Bật/Tắt cấu hình)"]
      SettingsSyncTests["PipelineOrchestratorSettingsSyncTests"]
```

---

## 2. 🔄 LUỒNG THỰC THI PIPELINE & THỨ TỰ ƯU TIÊN (EXECUTION FLOW)

Mỗi đoạn văn bản từ Clipboard sẽ chạy qua một chuỗi Pipeline gồm 6 Sub-Filters được sắp xếp theo `Priority` từ thấp đến cao (thực hiện trước $\to$ sau):

```mermaid
flowchart TD
    RawInput(["📥 Raw Clipboard Text (Win32 Hook)"]) --> PreNorm["🧹 Pre-Normalize (Xóa \\r, nén space, trim)"]
    
    subgraph PipelineExecution ["🚀 Chuỗi Bộ Lọc Tuần Tự (Ordered Pipeline)"]
        direction TB
        F1["1️⃣ UnicodeSanitizerFilter (Priority 1)<br/>• FormC Normalization<br/>• Xóa Zero-width spaces, Soft-hyphen<br/>• Giải mã HTML Entities"]
        F2["2️⃣ ReplyQuoteFilter (Priority 2)<br/>• Cắt bỏ Header Reply trích dẫn Zalo/Mess"]
        F3["3️⃣ ZaloStickerFilter (Priority 3)<br/>• Xóa mã sticker: /-rose, /-heart...<br/>• Xóa thẻ hệ thống: [Hình ảnh], [Sticker]...<br/>• Xóa dòng kẻ phân cách (====, ----)"]
        F4["4️⃣ BrandRegexFilter (Priority 4)<br/>• Xóa tag thương hiệu: TL House...<br/>• Xóa dòng footer nguồn hàng rỗng"]
        F5["5️⃣ CommissionRegexFilter (Priority 5)<br/>• Xóa hoa hồng dính trước Mã: 🌷 40%-12m 🏆 Mã<br/>• Xóa Header hoa hồng rỗng: 🌷 Hoa hồng:<br/>• Xóa danh sách HĐ hoa hồng: • HĐ 6 tháng:<br/>• Xóa dòng hoa hồng % / tiền / tháng độc lập<br/>• Xóa dòng thưởng sale / bonus / thưởng nóng<br/>• 🛡️ Bảo vệ dòng chứa Mã / Địa chỉ"]
        F6["6️⃣ UrlSanitizerFilter (Priority 6)<br/>• Lọc và loại bỏ URL ngoài luồng"]
        
        F1 --> F2
        F2 --> F3
        F3 --> F4
        F4 --> F5
        F5 --> F6
    end
    
    PreNorm --> F1
    F6 --> PostNorm["✨ Post-Normalize (Nén \\n thừa, định dạng sạch)"]
    PostNorm --> Output(["📤 Cleaned Text (Giao diện Live Preview / Paste)"])
```

---

## 3. 🧩 BẢN ĐỒ CẤU TRÚC REGEX (`FilterRegexPatterns.cs`)

Hệ thống Regex được xây dựng theo phương pháp **Modular Regex Lego Blocks** (Ghép các Sub-pattern nhỏ thành chuỗi phân đoạn phức tạp):

```mermaid
graph LR
    subgraph BuildingBlocks ["🧩 Sub-Patterns Cơ Bản"]
        Emoji["EmojiPrefix<br/>(🌷, 🌸, /-rose...)"]
        KW["KeywordPrefix<br/>(HH, Hoa hồng...)"]
        Dur["Duration<br/>(12th, 6-12m, HĐ 6T...)"]
        Note["NoteBracket<br/>(Chủ dẫn 30%, Thưởng...)"]
        Pct["PercentSingle<br/>(30%, 30%-40%...)"]
        Mon["MoneySingle<br/>(1tr1, 500k...)"]
        Mth["MonthSingle<br/>(1 tháng, 1/2 tháng, 1T...)"]
    end

    subgraph CompositePatterns ["🧱 Composite Segments & Chains"]
        Hdr["HeaderPrefix<br/>(Emoji + Từ khóa HH)"]
        Seg["CommSegment<br/>(Header? + Giá trị + Note?)"]
        Chain["CommChain<br/>(Nhiều Segments liên tiếp)"]
    end

    subgraph CompiledRegexes ["🚀 Compiled Regex Instances"]
        R1["CommissionRegex<br/>(Hoa hồng dính trước Mã/Cúp)"]
        R2["OrphanEmojiRegex<br/>(Emoji/Header rỗng trước Mã)"]
        R3["CommissionHeaderLineRegex<br/>(Dòng tiêu đề HH rỗng: '🌷 Hoa hồng:')"]
        R4["CommissionContractTermLineRegex<br/>(Dòng chi tiết HĐ: '• HĐ 6 tháng:')"]
        R5["CommissionLinePercentRegex<br/>(Dòng hoa hồng % độc lập)"]
        R6["CommissionLineMoneyRegex<br/>(Dòng hoa hồng tiền độc lập)"]
        R7["CommissionLineBonusRegex<br/>(Dòng thưởng sale, bonus)"]
        R8["ProtectedLinePrefixRegex<br/>(Bảo vệ dòng Mã, Địa chỉ, Giá, Trống)"]
    end

    Emoji --> Hdr
    KW --> Hdr
    Hdr --> Seg
    Pct --> Seg
    Mon --> Seg
    Dur --> Pct
    Dur --> Mon
    Note --> Seg
    Seg --> Chain

    Chain --> R1
    Hdr --> R2
    Hdr --> R3
    Dur --> R4
    Pct --> R4
    Mth --> R4
    Chain --> R5
    Mth --> R5
    Hdr --> R5
    Mon --> R6
```

---

## 4. 📋 DANH SÁCH FILE & PHỤ THUỘC KHI BẢO TRÌ (DEPENDENCY MATRIX)

Khi cần chỉnh sửa, tối ưu hoặc bổ sung Regex mới, dưới đây là danh sách toàn bộ các file liên quan theo thứ tự phân tầng:

| Phân tầng | Đường dẫn File | Trách nhiệm chính | Khi nào cần sửa? |
| :--- | :--- | :--- | :--- |
| **0_Shared** | `0_Shared/Models/MessageFilter/FilterPipelineOptions.cs` | DTO cấu hình Bật/Tắt các bộ lọc | Khi bổ sung SubFilter mới cần có toggle ON/OFF |
| **1_Backend** | `1_Backend/Services/MessageFilter/Helpers/FilterRegexPatterns.cs` | **Trọng tâm Regex**: Chứa Sub-patterns và Compiled Regexes | **Mọi trường hợp thêm pattern hoặc đổi logic Regex** |
| **1_Backend** | `1_Backend/Services/MessageFilter/SubFilters/CommissionRegexFilter.cs` | Sub-Filter xử lý hoa hồng (dính mã, lọc theo dòng) | Khi cần thay đổi luồng quét (line-by-line vs regex replace) |
| **1_Backend** | `1_Backend/Services/MessageFilter/ClipboardPipelineManager.cs` | Engine điều phối toàn bộ chuỗi Pipeline & Normalize | Khi cần thay đổi logic Normalize khoảng trắng hoặc thứ tự bộ lọc |
| **1_Backend** | `1_Backend/Contracts/Interfaces/IClipboardFilter.cs` | Interface chuẩn của mọi SubFilter | Khi cần thay đổi hợp đồng lọc hoặc metadata |
| **Tests** | `Tests/MessageFilter/CommissionRegexFilterTests.cs` | Unit Tests kiểm tra từng Regex/Dòng độc lập | **Bắt buộc**: Viết test case cô lập cho pattern mới |
| **Tests** | `Tests/MessageFilter/PipelineTests.cs` | Integration Tests toàn bộ Pipeline với tin nhắn thật | **Bắt buộc**: Viết test case End-to-End cho tin nhắn đầy đủ |

---

## 5. 🛠️ PLAYBOOK: QUY TRÌNH 5 BƯỚC THÊM/SỬA REGEX MỚI

Khi gặp một mẫu tin nhắn bất động sản mới phát sinh (ví dụ: format hoa hồng mới, mẫu thưởng mới, ký tự sticker lạ), thực hiện theo đúng 5 bước chuẩn hóa sau:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / AI
    participant Doc as Phân tích Mẫu Tin
    participant Patterns as FilterRegexPatterns.cs
    participant Filter as CommissionRegexFilter.cs
    participant Test as Test Suites
    participant Build as Dotnet Build & Test

    Dev->>Doc: 1. Xác định Input, Output mong muốn & Nguy cơ False-Positive
    Dev->>Patterns: 2. Định nghĩa Sub-pattern / Compiled Regex (kèm ReDoS Timeout)
    Dev->>Filter: 3. Tích hợp Regex vào vòng lặp quét dòng hoặc replace
    Dev->>Test: 4. Thêm Unit Test cô lập & Test E2E thực tế
    Dev->>Build: 5. Chạy 'dotnet test' & 'dotnet build' kiểm tra 100% Pass
    Build-->>Dev: ✅ Hoàn tất an toàn (Không làm vỡ 32+ tests cũ)
```

### Chi tiết các bước thực hiện:

### 🔹 Bước 1: Thu Thập & Phân Tích Scope Mẫu Tin
- Ghi lại chuỗi **Input** thô.
- Xác định chuỗi **Expected Output** sau khi lọc.
- Đặt câu hỏi phản biện: *Regex mới có nguy cơ xóa nhầm thông tin hợp lệ không?* (ví dụ: dòng Giá `☘ Giá: 6tr2`, dòng Trống `⌛️ Trống: 1/9`, Điều kiện thuê `📌 HĐ 12 tháng`).

### 🔹 Bước 2: Bổ Sung Pattern vào `FilterRegexPatterns.cs`
- Nếu là thành phần nhỏ (thời gian, đơn vị tiền, từ khóa): Bổ sung vào `Patterns.*`.
- Nếu là Regex hoàn chỉnh: Tạo `public static readonly Regex ...Regex = new(...)`.
- **Quy tắc bắt buộc**:
  - Luôn cấu hình `RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase`.
  - Luôn truyền `DefaultRegexTimeout` (`TimeSpan.FromMilliseconds(250)`) để chống ReDoS.

### 🔹 Bước 3: Đấu Nối vào `CommissionRegexFilter.cs`
- Nếu là dạng dính liền trước Mã $\to$ Đặt ở đầu hàm qua `.Replace(text, "")`.
- Nếu là dạng dòng độc lập $\to$ Đặt trong vòng lặp `while ((rawLine = reader.ReadLine()) != null)`:
  ```csharp
  if (FilterRegexPatterns.YourNewRegex.IsMatch(trimmed) &&
      !FilterRegexPatterns.ProtectedLinePrefixRegex.IsMatch(trimmed))
  {
      continue; // Bỏ qua dòng rác
  }
  ```

### 🔹 Bước 4: Viết Test Case Xác Thực
- Mở `CommissionRegexFilterTests.cs` $\to$ Thêm mẫu vào `[Theory] [InlineData(...)]` hoặc viết `[Fact]` mới.
- Mở `PipelineTests.cs` $\to$ Thêm `[Fact] public void TC{XX}_...()` với toàn bộ tin nhắn thật.

### 🔹 Bước 5: Chạy Kiểm Thử Toàn Bộ
- Thực thi lệnh:
  ```powershell
  dotnet test
  dotnet build
  ```
- Đảm bảo **100% Test Passed** và **0 Warning, 0 Error**.

---

## 6. 🛡️ QUY TẮC BẢO VỆ CHỐNG XÓA NHẦM (FALSE-POSITIVE SHIELD)

Để đảm bảo không bao giờ xóa nhầm dữ liệu quan trọng của khách hàng/môi giới, hệ thống áp dụng cơ chế 3 lớp bảo vệ:

1. **Lớp 1 - Regex Tiền Tố Bảo Vệ (`ProtectedLinePrefixRegex`)**:
   - Mọi dòng bắt đầu bằng `Mã:`, `🏆`, `🎖️`, `⭐`, `📍`, `🏢 Địa chỉ`, `☘ Giá`, `⌛️ Trống`, `TL...`, `H...`, `P...` sẽ **không bao giờ** bị xóa bởi các regex lọc thưởng/ghi chú.
2. **Lớp 2 - Định Dạng Dấu Hai Chấm (`:`) Ngược**:
   - `HĐ 6 tháng:` (thời gian trước dấu `:`) $\rightarrow$ Khối hoa hồng $\rightarrow$ **Xóa**.
   - `📌 Điều kiện: HĐ 6 tháng` (thời gian sau dấu `:`) $\rightarrow$ Điều kiện thuê phòng $\rightarrow$ **Giữ lại**.
3. **Lớp 3 - ReDoS & Character Limit Protection**:
   - Giới hạn payload tối đa (`MaxPayloadCharacterLimit = 20,000`).
   - Timeout tối đa 250ms trên mỗi lần khớp mẫu Regex.
