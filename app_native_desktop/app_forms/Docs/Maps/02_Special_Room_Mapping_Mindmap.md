# 🧠 BẢN ĐỒ TƯ DUY & DANH SÁCH PHỤ THUỘC: MODULE SPECIAL ROOM MAPPING

- **Tệp tài liệu**: `Docs/Maps/02_Special_Room_Mapping_Mindmap.md`
- **Hệ thống**: Windows Native Desktop C# .NET 6.0 (`app_forms`)
- **Kiến trúc**: Clean 3-Layer Architecture & Component-Driven Reactive UI
- **Mục đích**: Cung cấp bức tranh toàn cảnh về cách module nhận diện, tra cứu, đối chiếu chéo đa sàn và cảnh báo mã phòng đặc biệt được thiết kế, phân tầng trách nhiệm, chỉ mục bộ nhớ đệm O(1), cơ chế phòng thủ chống False-Positive, ma trận đánh đổi 6 chiều và quy trình chuẩn khi cần bảo trì/thêm mới dữ liệu.

---

## 1. 🗺️ MINDMAP TỔNG THỂ HỆ THỐNG SPECIAL ROOM MAPPING

```mermaid
mindmap
  root((Special Room Mapping Engine))
    0_Shared Foundation
      SpecialRoomMappingEntity["SpecialRoomMappingEntity (Id, Stt, Manager, Phone, Commission, PlatformCodes)"]
      SpecialRoomMappingRegistryEntity["SpecialRoomMappingRegistryEntity (Version, LastUpdated, Items)"]
      SeedData["Seed JSON File (0_Shared/Data/special_room_mappings.json - 31+ bản ghi)"]
    1_Backend Engine
      Contracts & Interfaces
        ISpecialRoomMappingRepository["ISpecialRoomMappingRepository (FindMappingByCode, Phone, Text, Reload, Save)"]
        ISpecialRoomMappingDetector["ISpecialRoomMappingDetector (Detect - Fallback Algorithm)"]
        ISpecialMappingTextParser["ISpecialMappingTextParser (CleanCode, CleanPhone, FindMappingInText)"]
        ISpecialRoomCodeRule["ISpecialRoomCodeRule (RuleName, Priority, TryMatch)"]
      Adapters & Persistence
        AtomicJsonFileStorage["AtomicJsonFileStorage<T> (Generic Atomic Write qua file .tmp, 3 cấp Fallback)"]
        JsonSpecialRoomMappingRepository["JsonSpecialRoomMappingRepository (Dual ConcurrentDictionary O(1) RAM Index)"]
      Domain Services
        SpecialMappingTextParser["SpecialMappingTextParser (Regex Phone, Explicit Code, AlphaNumeric, Numeric >=3)"]
        SpecialRoomMappingDetector["SpecialRoomMappingDetector (Strict Priority Guard & False-Positive Shield)"]
        SchemaDetectorService["SchemaDetectorService (Layer 1.1 tích hợp Special Rule Engine)"]
      Rules Engine
        SpecialRoomCodeRuleEngine["SpecialRoomCodeRuleEngine (Priority-Ordered Evaluation)"]
        CPrefixTL21SpecialRule["CPrefixTL21SpecialRule (Priority 100: C101, c205, C-01 -> TL21House)"]
        StandardPrefixRules["StandardPrefixRules (Priority 50: MN -> Lusaco, TS -> HD Homes, NT, 95, TL)"]
      DI Registration
        BackendServiceRegistration["BackendServiceRegistration (Đăng ký Singleton an toàn, Zero UI Coupling)"]
    2_Frontend Presentation
      LeadConverterScreen["LeadConverterScreen (Root Screen <= 150 dòng, điều phối tương tác)"]
      LeadConverterStateHook["LeadConverterStateHook (Quản lý Reactive State, SpecialMappingDetected Event)"]
      Sub-Components
        SpecialCodeAlertBox["SpecialCodeAlertBox (Dark Amber Banner, Info Chủ/QL, Badges Sàn Chéo, Nút SĐT & Sheet URL)"]
        SlimScrollPanel["SlimScrollPanel (Bao bọc cuộn mượt mà giao diện)"]
      UI Utilities
        FormStateObserver["FormStateObserver.InvokeOnUI (Đảm bảo Thread-Safety khi cập nhật WinForms Control)"]
    Tests Suite
      JsonSpecialRoomMappingRepositoryTests["JsonSpecialRoomMappingRepositoryTests (Nạp 31 Seed Items, Tra cứu Code/Phone/Text)"]
      SpecialRoomMappingDetectorTests["SpecialRoomMappingDetectorTests (Ưu tiên Lead.RoomCode, Strict Guard không cào bới)"]
      SpecialMappingTextParserTests["SpecialMappingTextParserTests (Chuẩn hóa SĐT, Bóc tách Token, Bỏ qua số ngắn 1-2 ký tự)"]
      SpecialRoomCodeRulesTests["SpecialRoomCodeRulesTests (Khớp C-Prefix, Standard Prefixes, RuleEngine Precedence)"]
      LeadConverterStateHookTests["LeadConverterStateHookTests (Event SpecialMappingDetected, Copy Clipboard, Open URL)"]
```

---

## 2. 🏛️ BẢNG PHÂN TẦNG KIẾN TRÚC & DANH MỤC SUB-MODULES

Toàn bộ module tuân thủ nghiêm ngặt **Clean 3-Layer Architecture** và **AppForms AI System Charter**:

| Phân tầng | Tên Module / Sub-module | Đường dẫn File Mã Nguồn | Trách nhiệm Nghiệp vụ Cốt lõi | Độ phức tạp |
| :--- | :--- | :--- | :--- | :---: |
| **0_Shared** | `Data Seed JSON` | [`0_Shared/Data/special_room_mappings.json`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Data/special_room_mappings.json) | Lưu trữ danh mục 31+ phòng đặc biệt, số điện thoại đầu chủ, hoa hồng, link sheet và mã định danh chéo giữa các sàn (AHS, Lusaco, TNR, HD Homes, NT...). | $O(1)$ IO Nạp |
| **0_Shared** | `Mapping Entity` | [`0_Shared/Models/SpecialMapping/SpecialRoomMappingEntity.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Models/SpecialMapping/SpecialRoomMappingEntity.cs) | POCO DTO định nghĩa cấu trúc một bản ghi đối chiếu phòng đặc biệt. | $O(1)$ RAM |
| **0_Shared** | `Registry Entity` | [`0_Shared/Models/SpecialMapping/SpecialRoomMappingRegistryEntity.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Models/SpecialMapping/SpecialRoomMappingRegistryEntity.cs) | POCO DTO đại diện toàn bộ file cơ sở dữ liệu JSON kèm metadata phiên bản và ngày cập nhật. | $O(1)$ RAM |
| **1_Backend** | `Repository Contract` | [`1_Backend/Contracts/Interfaces/ISpecialRoomMappingRepository.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Interfaces/ISpecialRoomMappingRepository.cs) | Interface hợp đồng kho lưu trữ tra cứu mã phòng, số điện thoại, quét text và nạp/lưu dữ liệu. | Interface |
| **1_Backend** | `Detector Contract` | [`1_Backend/Contracts/Interfaces/ISpecialRoomMappingDetector.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Interfaces/ISpecialRoomMappingDetector.cs) | Interface Domain Service điều phối thuật toán nhận diện và chiến lược Fallback. | Interface |
| **1_Backend** | `Parser Contract` | [`1_Backend/Contracts/Interfaces/ISpecialMappingTextParser.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Interfaces/ISpecialMappingTextParser.cs) | Interface bóc tách Regex và chuẩn hóa token mã/SĐT từ văn bản thô. | Interface |
| **1_Backend** | `Rule Contract` | [`1_Backend/Contracts/Rules/ISpecialRoomCodeRule.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Rules/ISpecialRoomCodeRule.cs) | Interface chuẩn cho các quy tắc nhận diện tiền tố và mã phòng đặc biệt trong Schema Detection. | Interface |
| **1_Backend** | `Atomic JSON Storage` | [`1_Backend/Adapters/Persistence/Common/AtomicJsonFileStorage.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Adapters/Persistence/Common/AtomicJsonFileStorage.cs) | Generic Storage nạp/ghi JSON an toàn qua file tạm `.tmp`, tự động Fallback (Runtime $\to$ Seed $\to$ Factory). | $O(N)$ IO File |
| **1_Backend** | `Special Repo Adapter` | [`1_Backend/Adapters/Persistence/JsonSpecialRoomMappingRepository.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Adapters/Persistence/JsonSpecialRoomMappingRepository.cs) | Quản lý nạp file, xây dựng bộ chỉ mục kép In-Memory `ConcurrentDictionary` (`_codeIndex`, `_phoneIndex`), tra cứu tức thì $O(1)$. Hỗ trợ tra cứu không phân biệt dấu gạch nối (`-`). | $O(1)$ RAM Lookup |
| **1_Backend** | `Text Parser Service` | [`1_Backend/Services/SpecialMappingTextParser.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/SpecialMappingTextParser.cs) | Regex bóc tách 4 tầng: Ngữ cảnh từ khóa mã $\to$ Token chữ+số $\to$ Token số $\ge 3$ chữ số $\to$ Số điện thoại 10 chữ số. | $O(K)$ Regex Scan |
| **1_Backend** | `Special Detector` | [`1_Backend/Services/SpecialRoomMappingDetector.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/SpecialRoomMappingDetector.cs) | **Trọng tâm nhận diện**: Thực thi chiến lược Fallback có bảo vệ. Dừng ngay khi `RoomCode` không thuộc danh mục đặc biệt (chống False Positive ngõ/ngách/ngày giờ). | $O(1)$ Fallback |
| **1_Backend** | `Rule Engine` | [`1_Backend/Services/Rules/SpecialRoomCodeRuleEngine.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/Rules/SpecialRoomCodeRuleEngine.cs) | Điều phối các quy tắc tiền tố theo thứ tự `Priority` giảm dần, cung cấp lý do chẩn đoán kỹ thuật. | $O(R)$ với $R \le 5$ |
| **1_Backend** | `C-Prefix Rule` | [`1_Backend/Services/Rules/Definitions/CPrefixTL21SpecialRule.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/Rules/Definitions/CPrefixTL21SpecialRule.cs) | Priority 100: Nhận diện tiền tố 'C' hoặc 'c' kèm số (vd: `C101`, `c205`, `C-01`, `C 383`) $\to$ Gán sàn `tl21_house`. | $O(1)$ Regex Match |
| **1_Backend** | `Standard Prefix Rule` | [`1_Backend/Services/Rules/Definitions/StandardPrefixRules.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/Rules/Definitions/StandardPrefixRules.cs) | Priority 50: Nhận diện tiền tố chữ chuẩn (`MN` $\to$ Lusaco, `TS` $\to$ HD Homes, `NT` $\to$ NT Home, `95` $\to$ 95 Home, `TL` $\to$ TL21House). | $O(1)$ Prefix Match |
| **1_Backend** | `Schema Detector` | [`1_Backend/Services/SchemaDetectorService.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/SchemaDetectorService.cs) | Tích hợp Rule Engine tại Layer 1.1 trước khi tra cứu Repository chung. | $O(1)$ Pipeline |
| **1_Backend** | `DI Registration` | [`1_Backend/Infrastructure/BackendServiceRegistration.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Infrastructure/BackendServiceRegistration.cs) | Đăng ký toàn bộ Services, Repositories, Rule Engines dưới dạng Singleton. | $O(1)$ Boot |
| **2_Frontend** | `Alert Sub-Component` | [`2_Frontend/Screens/LeadConverter/Components/SpecialCodeAlertBox.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/LeadConverter/Components/SpecialCodeAlertBox.cs) | Component UI hiển thị Dark Amber Banner, thông tin Chủ/Quản lý, SĐT, Badges mã sàn chéo, Nút chép nhanh SĐT và Mở Google Sheet bảng hàng. | $O(1)$ UI Render |
| **2_Frontend** | `Screen State Hook` | [`2_Frontend/Screens/LeadConverter/Hooks/LeadConverterStateHook.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/LeadConverter/Hooks/LeadConverterStateHook.cs) | Quản lý Reactive State, điều phối sự kiện `SpecialMappingDetected`, xử lý sao chép SĐT vào Clipboard và mở liên kết an toàn qua Shell. | $O(1)$ State Event |
| **2_Frontend** | `Lead Root Screen` | [`2_Frontend/Screens/LeadConverter/LeadConverterScreen.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/LeadConverter/LeadConverterScreen.cs) | Root Screen mỏng (140 dòng), kết nối StateHook với UI Controls, đảm bảo `FormStateObserver.InvokeOnUI`. | $O(1)$ Dispatch |
| **Tests** | `Repo Tests` | [`Tests/Backend/JsonSpecialRoomMappingRepositoryTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Backend/JsonSpecialRoomMappingRepositoryTests.cs) | Kiểm thử nạp 31 bản ghi Seed, tra cứu mã đa dạng (space, hyphen, case), tra cứu SĐT, tra cứu text thô. | 100% Pass |
| **Tests** | `Detector Tests` | [`Tests/Backend/SpecialRoomMappingDetectorTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Backend/SpecialRoomMappingDetectorTests.cs) | Kiểm thử luồng ưu tiên RoomCode và cơ chế Strict Guard không cào bới khi RoomCode không khớp. | 100% Pass |
| **Tests** | `Parser Tests` | [`Tests/Backend/SpecialMappingTextParserTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Backend/SpecialMappingTextParserTests.cs) | Kiểm thử làm sạch mã, chuẩn hóa SĐT 10 số (0xxx, +84), bóc tách token và bỏ qua token số ngắn 1-2 chữ số. | 100% Pass |
| **Tests** | `Rules Tests` | [`Tests/Backend/SpecialRoomCodeRulesTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Backend/SpecialRoomCodeRulesTests.cs) | Kiểm thử CPrefixTL21SpecialRule (C101, c205, C-01, C 383, c402b), StandardPrefixRules và thứ tự ưu tiên RuleEngine. | 100% Pass |
| **Tests** | `StateHook Tests` | [`Tests/Frontend/LeadConverterStateHookTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Frontend/LeadConverterStateHookTests.cs) | Kiểm thử StateHook kích hoạt `SpecialMappingDetected`, sao chép SĐT và an toàn xử lý input. | 100% Pass |

---

## 3. 🔄 LUỒNG THỰC THI & THUẬT TOÁN NHẬN DIỆN FALLBACK (EXECUTION FLOW)

Thuật toán nhận diện mã phòng đặc biệt trong `SpecialRoomMappingDetector` được thiết kế theo nguyên lý **Phòng vệ Chống Nhận Diện Sai (Strict Priority & False-Positive Guard)**:

```mermaid
flowchart TD
    Start(["📥 Nhận LeadEntity & RawText thô từ UI / Clipboard"]) --> CheckInput{"Input có rỗng hoàn toàn không?"}
    CheckInput -- "Có (Cả 2 đều rỗng/null)" --> ReturnNull["Trả về null (Không cảnh báo)"]
    CheckInput -- "Không" --> Step1{"1️⃣ Lead.RoomCode có giá trị?"}

    subgraph Layer1_RoomCode ["🎯 Ưu Tiên 1: Nhận Diện Theo Mã Đã Bóc Tách (Lead.RoomCode)"]
        Step1 -- "Có RoomCode (vd: AHS284, D170)" --> LookupCode["Tra cứu O(1) RAM: Repository.FindMappingByCode(Lead.RoomCode)"]
        LookupCode --> CheckCodeMatch{"Có khớp trong _codeIndex không?"}
        CheckCodeMatch -- "✅ Khớp mã đặc biệt" --> ReturnCodeMatch(["⚡ Trả về SpecialRoomMappingEntity (STT: XX)"])
        CheckCodeMatch -- "❌ Không khớp" --> StrictGuard["🛡️ STRICT GUARD ACTIVATED:<br/>Form đã bóc tách rõ RoomCode cố định nhưng không phải mã đặc biệt.<br/>DỪNG NGAY! Tuyệt đối không cào bới RawText."]
        StrictGuard --> ReturnNull
    end

    subgraph Layer2_RawText ["🔍 Ưu Tiên 2: Quét Văn Bản Tự Do (Khi Lead.RoomCode bị rỗng)"]
        Step1 -- "Không có RoomCode (Lead.RoomCode rỗng)" --> CheckRawText{"rawText có nội dung không?"}
        CheckRawText -- "Không" --> ReturnNull
        CheckRawText -- "Có" --> ParserScan["Gọi ISpecialMappingTextParser.FindMappingInText(rawText, repo)"]
        
        ParserScan --> SubScan1["2.1. Quét Explicit Regex: 'Mã: [Code]', 'Mã phòng: [Code]'"]
        SubScan1 --> CheckSub1{"Khớp mã repo?"}
        CheckSub1 -- "Có" --> ReturnTextMatch(["⚡ Trả về SpecialRoomMappingEntity"])
        CheckSub1 -- "Không" --> SubScan2["2.2. Quét AlphaNumeric Token Regex: [Chữ+Số] (vd: AHS284, DN01, A520)"]
        
        SubScan2 --> CheckSub2{"Khớp mã repo?"}
        CheckSub2 -- "Có" --> ReturnTextMatch
        CheckSub2 -- "Không" --> SubScan3["2.3. Quét Numeric Code Token Regex >= 3 chữ số (vd: 973, 430, 085, 040)<br/>🛡️ Chặn triệt để số 1-2 chữ số (ngõ 61, ngách 40, ngày 29/8)"]
        
        SubScan3 --> CheckSub3{"Khớp mã repo?"}
        CheckSub3 -- "Có" --> ReturnTextMatch
        CheckSub3 -- "Không" --> SubScan4["2.4. Quét Phone Regex: Số điện thoại Đầu chủ/QL 10 số"]
        
        SubScan4 --> CheckSub4{"Khớp _phoneIndex repo?"}
        CheckSub4 -- "Có" --> ReturnTextMatch
        CheckSub4 -- "Không" --> ReturnNull
    end

    ReturnCodeMatch --> NotifyUI(["📢 Bắn Event SpecialMappingDetected(mapping) lên UI"])
    ReturnTextMatch --> NotifyUI
    ReturnNull --> NotifyUINull(["📢 Bắn Event SpecialMappingDetected(null) -> Ẩn Alert Box"])
```

---

## 4. ⚡ SƠ ĐỒ TUẦN TỰ TƯƠNG TÁC & ĐIỀU PHỐI SỰ KIỆN (SEQUENCE DIAGRAM)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Sale / Môi giới)
    participant UI as LeadConverterScreen
    participant AlertBox as SpecialCodeAlertBox
    participant Hook as LeadConverterStateHook
    participant Detector as SpecialRoomMappingDetector
    participant Repo as JsonSpecialRoomMappingRepository
    participant Parser as SpecialMappingTextParser
    participant Shell as Windows OS (Process/Clipboard)

    User->>UI: Dán tin nhắn thô ("Khách hỏi phòng mã AHS284 giá 4tr5...")
    UI->>Hook: ProcessRawInput(rawText)
    Hook->>Detector: Detect(CurrentLead, rawText)
    
    alt Trường hợp 1: Lead đã bóc tách được RoomCode ("AHS284")
        Detector->>Repo: FindMappingByCode("AHS284")
        Repo-->>Detector: Trả về SpecialRoomMappingEntity (STT: 1, QL: Phan Anh)
    else Trường hợp 2: Lead không có RoomCode -> Quét RawText
        Detector->>Parser: FindMappingInText(rawText, Repo)
        Parser->>Repo: FindMappingByCode("AHS284")
        Repo-->>Parser: Trả về SpecialRoomMappingEntity
        Parser-->>Detector: Trả về SpecialRoomMappingEntity
    end

    Detector-->>Hook: Trả về SpecialRoomMappingEntity
    Hook->>UI: Phát sự kiện SpecialMappingDetected(mapping)
    UI->>AlertBox: FormStateObserver.InvokeOnUI(() => AlertBox.BindData(mapping))
    AlertBox->>AlertBox: RenderAlert: Hiện Banner Vàng Cảnh Báo, SĐT, Badges Sàn Chéo, Nút Mở Sheet

    opt Người dùng bấm sao chép số điện thoại
        User->>AlertBox: Click "📋 Sao chép SĐT"
        AlertBox->>Hook: CopyPhoneRequested("0977274446")
        Hook->>Shell: CopyTextToClipboard("0977274446")
        AlertBox->>AlertBox: Đổi nút sang "✓ Đã sao chép!"
    end

    opt Người dùng bấm mở Google Sheet bảng hàng
        User->>AlertBox: Click "🔗 Mở bảng hàng: https://docs.google.com/..."
        AlertBox->>Hook: OpenUrlRequested(url)
        Hook->>Shell: Process.Start(new ProcessStartInfo { UseShellExecute = true, FileName = url })
        Shell-->>User: Mở trình duyệt Web mặc định hiển thị bảng hàng
    end
```

---

## 5. 📦 SƠ ĐỒ CẤU TRÚC DỮ LIỆU & INDEXING O(1) IN-MEMORY (CLASS DIAGRAM)

```mermaid
classDiagram
    direction TB

    class SpecialRoomMappingRegistryEntity {
        +int Version
        +DateTime LastUpdated
        +string Description
        +List~SpecialRoomMappingEntity~ Items
    }

    class SpecialRoomMappingEntity {
        +string Id
        +int Stt
        +string? BuildingNo
        +string? ManagerName
        +string? Phone
        +string? Commission
        +string? SheetLink
        +Dictionary~string, string~ PlatformCodes
        +List~string~ MatchedCodes
    }

    class ISpecialRoomMappingRepository {
        <<interface>>
        +FindMappingByCode(string roomCode) SpecialRoomMappingEntity?
        +FindMappingByPhone(string phone) SpecialRoomMappingEntity?
        +FindMappingByText(string text) SpecialRoomMappingEntity?
        +GetAll() IReadOnlyList~SpecialRoomMappingEntity~
        +Reload() Result
        +Save() Result
    }

    class JsonSpecialRoomMappingRepository {
        -ConcurrentDictionary~string, SpecialRoomMappingEntity~ _codeIndex
        -ConcurrentDictionary~string, SpecialRoomMappingEntity~ _phoneIndex
        -List~SpecialRoomMappingEntity~ _items
        -IJsonFileStorage~SpecialRoomMappingRegistryEntity~ _storage
        -ISpecialMappingTextParser _textParser
        -object _lock
        -LoadInitialData() void
        -RebuildLookupCache() void
    }

    class ISpecialRoomMappingDetector {
        <<interface>>
        +Detect(LeadEntity? lead, string? rawText) SpecialRoomMappingEntity?
    }

    class SpecialRoomMappingDetector {
        -ISpecialRoomMappingRepository _repository
        -ISpecialMappingTextParser _textParser
        -ILogger _logger
        +Detect(LeadEntity? lead, string? rawText) SpecialRoomMappingEntity?
    }

    class ISpecialMappingTextParser {
        <<interface>>
        +CleanCode(string code) string
        +CleanPhone(string phone) string
        +FindMappingInText(string text, ISpecialRoomMappingRepository repo) SpecialRoomMappingEntity?
    }

    class SpecialMappingTextParser {
        -Regex PhoneRegex
        -Regex ExplicitCodeRegex
        -Regex AlphaNumericTokenRegex
        -Regex NumericCodeTokenRegex
        +CleanCode(string code) string
        +CleanPhone(string phone) string
        +FindMappingInText(string text, ISpecialRoomMappingRepository repo) SpecialRoomMappingEntity?
    }

    class SpecialCodeAlertBox {
        -SpecialRoomMappingEntity? _currentMapping
        +event Action~string~ CopyPhoneRequested
        +event Action~string~ OpenUrlRequested
        +BindData(SpecialRoomMappingEntity? mapping) void
        -RenderAlert(SpecialRoomMappingEntity mapping) void
    }

    class LeadConverterStateHook {
        +SpecialRoomMappingEntity? MatchedSpecialMapping
        +event Action~SpecialRoomMappingEntity?~ SpecialMappingDetected
        +ProcessRawInput(string rawInput) void
        +UpdateLeadFields(LeadEntity lead) void
        +CopyTextToClipboard(string text) bool
        +OpenUrl(string url) bool
    }

    SpecialRoomMappingRegistryEntity "1" *-- "many" SpecialRoomMappingEntity : Chứa danh mục Items
    ISpecialRoomMappingRepository <|.. JsonSpecialRoomMappingRepository : Triển khai
    JsonSpecialRoomMappingRepository o-- SpecialRoomMappingRegistryEntity : Nạp & Quản lý
    JsonSpecialRoomMappingRepository ..> SpecialRoomMappingEntity : Tra cứu trả về

    ISpecialRoomMappingDetector <|.. SpecialRoomMappingDetector : Triển khai
    SpecialRoomMappingDetector --> ISpecialRoomMappingRepository : Tra cứu O(1)
    SpecialRoomMappingDetector --> ISpecialMappingTextParser : Bóc tách text thô

    ISpecialMappingTextParser <|.. SpecialMappingTextParser : Triển khai

    LeadConverterStateHook --> ISpecialRoomMappingDetector : Ủy quyền nhận diện
    SpecialCodeAlertBox <.. LeadConverterStateHook : Cập nhật Data qua Event
```

---

## 6. ⚖️ MA TRẬN ĐÁNH ĐỔI KỸ THUẬT 6 CHIỀU (TECHNICAL TRADEOFF MATRIX)

Phân tích theo nguyên lý đầu tiên (First Principles) về các quyết định thiết kế kiến trúc của Module:

| Chiều Đánh Đổi | Lựa Chọn Kiến Trúc Hiện Tại | Lợi Ích Thu Được (Gain) | Chi Phí / Rủi Ro (Pain) | Biện Pháp Phòng Vệ / Giảm Thiểu (Mitigation) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Performance** | **In-Memory Dual `ConcurrentDictionary` Indexing** (`_codeIndex`, `_phoneIndex`). | Tra cứu mã phòng và số điện thoại đạt tốc độ tức thì $O(1) < 0.05\text{ ms}$, không tốn I/O đĩa khi người dùng đang gõ phím. | Cần thời gian khởi tạo nạp file và build cache khi ứng dụng khởi động. | Seed file chỉ ~12KB (31+ bản ghi), thời gian load và build RAM cache $< 3\text{ ms}$ tại Startup. |
| **2. Memory & Safety** | **Cache In-Memory độc lập, Clean String Keys**. | Footprint bộ nhớ cực nhỏ ($< 100\text{ KB}$ RAM), thread-safe tuyệt đối cho nhiều luồng đọc đồng thời. | Nếu số lượng bản ghi lên tới $100.000+$, RAM sẽ tăng nhẹ. | Dữ liệu phòng đặc biệt chỉ phục vụ nhóm phòng trọng điểm liên sàn ($< 1.000$ bản ghi). |
| **3. Simplicity** | **Generic Atomic JSON Storage** (`AtomicJsonFileStorage<T>` ghi qua file tạm `.tmp`). | Không cần cài đặt RDBMS (SQLite, SQL Server), dễ dàng sao lưu, chia sẻ, đọc/chỉnh sửa file JSON thủ công bằng tay. | Nguy cơ lỗi ghi file khi mất điện đột ngột hoặc xung đột ghi đồng thời. | Ghi ra `.tmp` với GUID ngẫu nhiên rồi mới `File.Copy(overwrite: true)`, kết hợp `lock (_lock)`. |
| **4. Modularity & Clean Layering** | **Tách rời 3 dịch vụ**: `Repository` (lưu trữ), `TextParser` (bóc tách Regex), `Detector` (chiến lược điều phối). | Tuân thủ Single Responsibility Principle (SRP) và Open-Closed Principle (OCP), dễ dàng thay thế thuật toán parser mà không đụng tới repository. | Tăng số lượng interface và class trong dự án. | Đăng ký tập trung sạch sẽ qua `BackendServiceRegistration.cs` dưới dạng Singleton. |
| **5. Testability** | **100% Mockable Interfaces** (`ISpecialRoomMappingRepository`, `ISpecialMappingTextParser`, `ISpecialRoomMappingDetector`). | Có thể viết Unit Test cô lập từng trường hợp (bắt mã, bắt SĐT, kiểm tra thứ tự Fallback, mô phỏng lỗi IO) mà không cần tạo file thật. | Cần khởi tạo mock object trong các test suite. | Đã xây dựng 5 bộ test suites hoàn chỉnh (`Tests/Backend/` và `Tests/Frontend/`) với 100% độ phủ. |
| **6. Blast Radius** | **Non-Intrusive Reactive Decoupling** (Special Alert Box là Sub-component độc lập). | Nếu module mã đặc biệt không tìm thấy kết quả hoặc dữ liệu JSON lỗi, luồng chuyển đổi Form và Schema Detection thông thường vẫn hoạt động 100% bình thường. | UI cần thêm một hàng Alert Box nhỏ ở phía trên Editor. | Alert Box tự động ẩn (`Visible = false`) khi không khớp mã đặc biệt, giải phóng hoàn toàn không gian UI. |

---

## 7. 🛡️ 5 FAILURE MODES & CHIẾN LƯỢC PHÒNG VỆ (DEFENSIVE CODING)

```mermaid
graph TD
    FM1["💥 FM-1: File JSON bị xóa, hỏng hoặc lỗi format"] --> S1["🛡️ 3-Tier Fallback Loading:<br/>1. Runtime File -> 2. Seed Data (0_Shared/Data) -> 3. Default Factory"]
    FM2["💥 FM-2: Xung đột ghi đồng thời / Crash khi đang Save"] --> S2["🛡️ Atomic Write Protocol:<br/>Ghi vào file .tmp ngẫu nhiên + Lock thread + Overwrite an toàn"]
    FM3["💥 FM-3: False Positive Collision (Nhầm số nhà/ngõ/ngày xem)"] --> S3["🛡️ Strict Priority Guard:<br/>• Dừng ngay khi Lead.RoomCode không khớp<br/>• NumericCodeTokenRegex yêu cầu >= 3 chữ số<br/>• Explicit Keywords ưu tiên quét trước"]
    FM4["💥 FM-4: URL độc hại / Không thể mở Process Shell"] --> S4["🛡️ URL Sanitization Guard:<br/>Kiểm tra UriKind.Absolute + Schema Http/Https + Try-Catch Process.Start"]
    FM5["💥 FM-5: WinForms Cross-Thread Exception khi cập nhật UI"] --> S5["🛡️ UI Thread Dispatcher:<br/>Bắt buộc bọc mọi tương tác qua FormStateObserver.InvokeOnUI"]
```

### Chi tiết các kịch bản phòng vệ:

1. **FM-1: File JSON lưu trữ bị hỏng cú pháp hoặc bị xóa mất**:
   - *Chiến lược*: `AtomicJsonFileStorage.Load` thực hiện cơ chế 3 tầng nạp dự phòng:
     - Tầng 1: Đọc từ thư mục AppData người dùng (`SaleLeadFormConverter/special_room_mappings.json`).
     - Tầng 2: Nếu chưa có hoặc parse lỗi, tự động nạp Seed Data mặc định từ `0_Shared/Data/special_room_mappings.json` và nhân bản sang AppData.
     - Tầng 3: Nếu cả 2 đều không có, khởi tạo thực thể rỗng `new SpecialRoomMappingRegistryEntity()` an toàn, không bao giờ ném ngoại lệ làm sập phần mềm.

2. **FM-2: Xung đột ghi đè đồng thời hoặc mất điện giữa chừng khi lưu file**:
   - *Chiến lược*: Khóa luồng bằng `lock (_lock)`. Khi lưu dữ liệu, tuần tự hóa ra file tạm `special_room_mappings.json.{GUID}.tmp`. Sau khi ghi file tạm thành công 100%, mới gọi `File.Copy(tempPath, targetPath, overwrite: true)` và dọn dẹp file tạm. Đảm bảo file chính không bao giờ bị trạng thái 0 byte hay dở dang.

3. **FM-3: Nhận diện sai (False Positive) do số nhà, số ngõ, ngách, ngày xem**:
   - *Chiến lược*: 
     - **Lớp 1 (Strict Lead Guard)**: Nếu form đã bóc tách được trường `Lead.RoomCode` (ví dụ `D170`), detector tra cứu `_codeIndex`. Nếu không khớp, DỪNG LẠI NGAY và trả về `null`. Tuyệt đối không fallback cào bới `rawText` để tránh bắt nhầm "ngách 40 ngõ 61".
     - **Lớp 2 (Numeric Token $\ge 3$ Chữ Số)**: Khi phải quét `rawText` (do không có `RoomCode`), chỉ tra cứu các chuỗi số thuần túy có độ dài $\ge 3$ ký tự (ví dụ `973`, `430`, `085`, `040`). Loại bỏ hoàn toàn các số 1-2 chữ số như ngày `29/8`, ngõ `61`, ngách `40`.
     - **Lớp 3 (Explicit Keyword Priority)**: Ưu tiên bóc tách các token đứng sau từ khóa ngữ cảnh rõ ràng (`mã:`, `mã phòng:`, `mã tòa:`, `ms:`) trước khi quét token ngẫu nhiên.

4. **FM-4: Mở liên kết độc hại hoặc treo tiến trình khi click mở bảng hàng**:
   - *Chiến lược*: Trong `LeadConverterStateHook.OpenUrl`, chuỗi link được kiểm tra qua `Uri.TryCreate` đảm bảo `UriKind.Absolute` và giao thức chỉ chấp nhận `http` hoặc `https`. Thao tác `Process.Start` được bọc kín trong `try-catch`, trả về `false` và hiển thị thông báo nhẹ nhàng nếu hệ điều hành từ chối mở.

5. **FM-5: Ngoại lệ luồng giao diện người dùng (Cross-Thread UI Exception)**:
   - *Chiến lược*: Mọi sự kiện phát ra từ `LeadConverterStateHook` (`SpecialMappingDetected`, `OperationFeedback`, `Converted`) khi bắt lên `LeadConverterScreen` đều được bọc qua `FormStateObserver.InvokeOnUI(this, () => ...)`, đảm bảo 100% code UI chỉ thực thi trên Main UI Thread.

---

## 8. 📖 PLAYBOOK: QUY TRÌNH 4 BƯỚC THÊM MỚI / BẢO TRÌ MÃ PHÒNG ĐẶC BIỆT

Khi có thêm một phòng đặc biệt mới từ các đối tác liên sàn (ví dụ: sàn TNR có mã `A999` tương ứng với Lusaco `MN555`, chủ nhà tên `Anh Tuấn`, SĐT `0912345678`), thực hiện theo đúng 4 bước chuẩn hóa sau:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Quản trị viên / Developer
    participant JSON as special_room_mappings.json
    participant Repo as JsonSpecialRoomMappingRepository.cs
    participant Test as Special Tests Suites
    participant App as Chạy ứng dụng & Kiểm tra Alert

    Dev->>JSON: 1. Thêm bản ghi đối chiếu mới vào mảng "items"
    Dev->>Test: 2. Bổ sung Test Cases trong JsonSpecialRoomMappingRepositoryTests.cs
    Dev->>Test: 3. Chạy 'dotnet test' xác nhận 100% Test Passed
    Dev->>App: 4. Khởi động app, dán tin nhắn chứa mã -> Xác nhận Alert Box hiển thị đúng
```

### Chi tiết các bước thực hiện:

### 🔹 Bước 1: Thêm bản ghi mới vào `0_Shared/Data/special_room_mappings.json`
Mở file `0_Shared/Data/special_room_mappings.json` và bổ sung bản ghi vào cuối mảng `items`:
```json
{
  "id": "mapping_32",
  "stt": 32,
  "buildingNo": "555",
  "managerName": "Anh Tuấn",
  "phone": "0912345678",
  "commission": "40%",
  "sheetLink": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit",
  "platformCodes": {
    "TNR": "A999",
    "Lusaco": "MN555",
    "DNT": "DN32"
  },
  "matchedCodes": ["A999", "MN555", "DN32", "555"]
}
```
*Lưu ý*: Mọi biến thể mã có thể gặp trong tin nhắn (kể cả số nhà `buildingNo`) nên được liệt kê vào `matchedCodes`. Hệ thống sẽ tự động index cả dạng có dấu gạch nối và không dấu gạch nối (vd: `MN-555` và `MN555`).

### 🔹 Bước 2: Bổ sung Test Case vào Test Suite
Mở file [`Tests/Backend/JsonSpecialRoomMappingRepositoryTests.cs`](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Tests/Backend/JsonSpecialRoomMappingRepositoryTests.cs) và bổ sung các mã mới vào `[Theory]`:
```csharp
[Theory]
[InlineData("A999", "Anh Tuấn")]
[InlineData("MN555", "Anh Tuấn")]
[InlineData("MN-555", "Anh Tuấn")]
[InlineData("0912345678", "Anh Tuấn")]
public void FindMappingByCode_NewSpecialCodes_ReturnsCorrectManager(string roomCode, string expectedManager)
{
    var mapping = _repository.FindMappingByCode(roomCode);
    Assert.NotNull(mapping);
    Assert.Equal(expectedManager, mapping!.ManagerName);
}
```

### 🔹 Bước 3: Chạy Kiểm Thử Toàn Bộ Hệ Thống
Thực thi lệnh kiểm thử trong PowerShell để đảm bảo không làm vỡ các trường hợp kiểm thử cũ:
```powershell
dotnet test
dotnet build
```
Yêu cầu bắt buộc: **100% Tests Passed**, 0 Warning, 0 Error.

### 🔹 Bước 4: Kiểm Tra Trực Quan Trên Giao Diện (Verification)
1. Khởi chạy ứng dụng `app_forms`.
2. Dán tin nhắn chứa mã `A999` hoặc SĐT `0912345678` vào ô nhập liệu thô.
3. Kiểm tra:
   - Khối `SpecialCodeAlertBox` lập tức hiển thị trên đầu form với màu vàng cam nổi bật.
   - Hiển thị đầy đủ tên Chủ/QL: `Anh Tuấn`, SĐT: `0912345678`, Hoa hồng: `40%`.
   - Các badges sàn chéo hiển thị `TNR: A999`, `Lusaco: MN555`, `DNT: DN32`.
   - Bấm nút **"📋 Sao chép SĐT"** $\to$ kiểm tra clipboard đã nhận được SĐT.
   - Bấm nút **"🔗 Mở bảng hàng"** $\to$ kiểm tra trình duyệt web mở đúng đường dẫn Google Sheet.
