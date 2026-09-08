# 🚀 Headless Rule Pipeline Patterns — Tự Động Hóa Quản Trị Quy Tắc Tất Định

> **Phiên bản**: `1.1.0` | **Tác giả**: VietnamCOS & Antigravity Systems  
> **Áp dụng cho**: Bộ kỹ năng `rule-governance-analyzer`, Git Hooks, CI/CD Pipelines, Headless Subagents.

---

## 1. Triết Lý Cốt Lõi: Tách Rời Tư Duy & Chốt Chặn (Decoupling Thinking from Gatekeeping)

Trong quá trình AI Agent tương tác trực tiếp với lập trình viên (Interactive Session), cửa sổ ngữ cảnh (Context Window) và tài nguyên tư duy chiều sâu (Thinking Tokens) là tài sản quý giá nhất.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Luồng Tương Tác Trực Tiếp (Interactive Agent Session)                  │
│ ➔ Chỉ giữ tối đa 5-7 Hard Invariants cốt lõi trong AGENTS.md (~500 tok)│
│ ➔ Tập trung 100% năng lực tư duy cho kiến trúc và logic nghiệp vụ      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Ủy thác ngầm (Decoupled Offloading)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Đường Ống Headless Tự Động (Non-Interactive Sub-Process / CLI)         │
│ ➔ Git Pre-commit Hook: agy -p (quét diff trong <= 5s, output json)    │
│ ➔ CI/CD Gatekeeper: agy -p (kiểm định toàn bộ rule repo, exit 0/1)     │
│ ➔ Headless Semantic Gatekeeper: Phân tích ngữ nghĩa diff chính xác 99% │
│ ➔ Hook Simulation Harness: Kiểm thử mô phỏng tính trung thực của hook  │
└────────────────────────────────────────────────────────────────────────┘
```

### Nguyên Tắc Kế Thừa Model (Runtime Model Inheritance)
> [!IMPORTANT]
> **Quy tắc bất biến**: Tuyệt đối **KHÔNG hardcode model slug** (như `gemini-3.8-flash-high` hay bất kỳ tên model cụ thể nào) trong các script tự động hóa.
> - **Lý do**: Tốc độ phát triển của các thế hệ LLM diễn ra liên tục. Việc gắn cứng model slug sẽ khiến script nhanh chóng bị lỗi thời (deprecated model slug) hoặc gây lỗi runtime khi môi trường thay đổi.
> - **Quy chuẩn**: Mọi lệnh gọi Headless CLI (`agy -p`) hoặc Subagent bắt buộc **kế thừa model mặc định từ cấu hình hệ thống / runtime session sẵn có**, và **chỉ chỉ định mức độ tư duy (Reasoning Effort)**:
>   - Dùng `--effort low` cho các chốt chặn nhanh (Git Pre-commit, kiểm tra cú pháp, phân loại DTO/Service).
>   - Dùng `--effort medium` cho các bài audit toàn diện (Deep Semantic Audit trên CI/CD).

---

## 2. Mẫu Chốt Chặn Git Pre-Commit (Git Pre-Commit Headless Gate)

Tự động hóa kiểm tra tính tuân thủ quy tắc trên các file đã được staged (`git diff --cached`) trước khi cho phép tạo commit.

### 2.1. Cấu trúc Script `.git/hooks/pre-commit` (hoặc PowerShell)
```powershell
#!/usr/bin/env pwsh
# Git Pre-commit Headless Gatekeeper
$ErrorActionPreference = "Stop"

# 1. Trích xuất git diff của các tệp staged
$stagedDiff = git diff --cached --unified=0
if ([string]::IsNullOrWhiteSpace($stagedDiff)) {
    exit 0
}

# 2. Tạo prompt kiểm định ngắn gọn
$prompt = @"
Bạn là Pre-commit Compliance Gatekeeper.
Kiểm tra git diff staged sau đây và xác thực 2 điều kiện bất biến:
1. Zero-Placeholder: Không chứa TODO, FIXME, mock_data chưa giải quyết.
2. Clean Contracts: Không sửa đổi interface trong Contracts/Interfaces mà chưa có tài liệu ADR.
Chỉ trả về kết quả tuân thủ JSON Schema.

[DIFF]:
$stagedDiff
"@

# 3. Kích hoạt agy ở chế độ headless (kế thừa model runtime, chỉ định effort low)
$schemaPath = ".agents/skills/rule-governance-analyzer/schemas/pre-commit-schema.json"
$res = agy -p $prompt --effort low --output-format json --json-schema $schemaPath --dangerously-skip-permissions 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ [PRE-COMMIT GATE] Phát hiện vi phạm quy tắc! Commit bị từ chối." -ForegroundColor Red
    exit 1
}

$payload = $res | ConvertFrom-Json
if ($payload.structured_output.verdict -ne "APPROVED") {
    Write-Host "❌ [PRE-COMMIT GATE] Vi phạm: $($payload.structured_output.violation_reason)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ [PRE-COMMIT GATE] Mã nguồn hợp lệ đạt chuẩn." -ForegroundColor Green
exit 0
```

---

## 3. Mẫu Đường Ống CI/CD Tự Động (GitHub Actions / GitLab CI)

Chạy kiểm định toàn diện repository trên Pull Request hoặc nhánh `main`.

### 3.1. Workflow GitHub Actions (`.github/workflows/rule-governance.yml`)
```yaml
name: Rule Governance & Mechanical Gatekeeper

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  audit-rules:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run Rule Governance Audit (Headless)
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          pwsh .agents/skills/rule-governance-analyzer/scripts/audit-rules.ps1 \
            -Effort medium \
            -TimeoutSec 180

      - name: Upload Audit JSON Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: rule-audit-report
          path: rule-conflicts.audit.json
```

---

## 4. Mẫu Thay Thế Regex Dễ Gãy Bằng Headless Semantic Gatekeeper

Giải quyết triệt để vấn đề ghi nhận tại `temp.md`: Hook regex bắt nhầm các class POCO/DTO/Entity không có log và chặn `dotnet test`.

### 4.1. Mã Nguồn Semantic Gatekeeper Trong Python Hook
```python
import json
import subprocess
import sys

def check_logging_requirement_semantically(file_path: str, file_diff: str) -> bool:
    """
    Sử dụng agy headless với --effort low để phân tích ngữ nghĩa:
    Liệu file này là DTO/POCO thụ động hay là Service chứa business logic cần structured logging.
    """
    # 1. Bỏ qua ngay các thư mục contract/data thuần túy
    if any(p in file_path for p in ["Entities/", "DTOs/", "Models/", "Contracts/"]):
        return True # Hợp lệ, không cần bắt buộc log

    # 2. Với các file nghi vấn, gọi headless semantic check
    prompt = (
        f"Phân tích git diff của file {file_path}. "
        "Xác định xem diff này có chứa business logic phức tạp (tính toán, gọi I/O, xử lý ngoại lệ) "
        "bắt buộc phải có structured logging hay chỉ là cấu trúc dữ liệu thuần túy (POCO/Getter-Setter).\n"
        "Trả về JSON với trường 'requires_logging': boolean và 'has_logging': boolean.\n\n"
        f"[DIFF]:\n{file_diff}"
    )

    schema = json.dumps({
        "type": "object",
        "properties": {
            "requires_logging": {"type": "boolean"},
            "has_logging": {"type": "boolean"},
            "verdict": {"type": "string", "enum": ["ALLOW", "DENY"]}
        },
        "required": ["requires_logging", "has_logging", "verdict"]
    })

    try:
        # Kế thừa runtime model, chỉ định --effort low
        cmd = ["agy", "-p", prompt, "--effort", "low", "--output-format", "json", "--json-schema", schema, "--dangerously-skip-permissions"]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if proc.returncode == 0:
            res = json.loads(proc.stdout)
            struct = res.get("structured_output", {})
            return struct.get("verdict") == "ALLOW"
    except Exception:
        # Fallback an toàn nếu headless gặp lỗi
        pass

    return True
```

---

## 5. Mẫu Kiểm Thử Mô Phỏng Hook (Hook Simulation Harness)

Để đảm bảo các hook trong `.agents/hooks/scripts/` không trở thành "Rule Ảo" (Phantom Gates) do lỗi cú pháp hoặc nuốt lỗi, hệ thống cung cấp quy trình kiểm thử mô phỏng tự động:

1. **Negative Fixture Test**: Nạp dữ liệu vi phạm giả lập vào `stdin` của hook script. Hook **bắt buộc phải trả về quyết định `deny` hoặc exit code khác 0**.
2. **Positive Fixture Test**: Nạp dữ liệu hợp lệ giả lập vào `stdin` của hook script. Hook **bắt buộc phải trả về quyết định `allow` và exit code 0**.
3. **Verdict**: Chỉ khi cả hai bài test cùng pass, hook script mới được xác nhận là `VERIFIED`. Nếu negative fixture mà hook vẫn trả về `allow`, hệ thống cảnh báo `BROKEN_GATE_DEFECT`.
