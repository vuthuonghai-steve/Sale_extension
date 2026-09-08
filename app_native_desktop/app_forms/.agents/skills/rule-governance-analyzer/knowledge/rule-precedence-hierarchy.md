# Ma Trận Thứ Bậc Thẩm Quyền Quy Tắc (Rule Precedence Hierarchy)

> **Mục đích**: Thiết lập trật tự pháp quy toán học tất định để AI Agent tự động phân xử và giải quyết mọi xung đột quy tắc trong hệ thống mà không cần phỏng đoán.

---

## 1. Mô Hình Phân Cấp 4 Tầng (4-Tier Precedence Hierarchy)

Khi có hai hoặc nhiều quy tắc điều chỉnh cùng một hành động, công cụ hoặc ngữ cảnh mà phát sinh mâu thuẫn, hệ thống **bắt buộc tuân thủ thứ bậc ưu tiên tuyệt đối** từ trên xuống dưới:

```
┌──────────────────────────────────────────────────────────┐
│ Level 1: Deterministic Hard Hooks (.agents/hooks.json)   │ ◄── Cao nhất (Kernel Enforcement)
├──────────────────────────────────────────────────────────┤
│ Level 2: Repository Hard Invariants (AGENTS.md / Anchors)│ ◄── Bất biến kiến trúc & Negative Space
├──────────────────────────────────────────────────────────┤
│ Level 3: Active Domain Skills (.agents/skills/*/SKILL.md)│ ◄── Tri thức chuyên sâu nạp On-Demand
├──────────────────────────────────────────────────────────┤
│ Level 4: Interactive User Runtime Prompts                │ ◄── Thấp nhất (Chỉ thị thời gian thực)
└──────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Từng Tầng Thẩm Quyền

### Level 1: Deterministic Hard Hooks (`.agents/hooks.json`)
- **Bản chất**: Chốt chặn cơ học vật lý ở tầng IPC/Process trước khi tool được thực thi (`PreToolUse`, `PostToolUse`).
- **Thẩm quyền**: **Bất khả kháng**. Không bất kỳ lời giải thích, prompt hay skill nào có thể ghi đè (override) một Hook từ chối (`deny` hoặc exit non-zero).
- **Phạm vi áp dụng**:
  - Bảo vệ an toàn dữ liệu: Cấm xóa database, cấm chạy lệnh hủy hoại `rm -rf`, `DROP TABLE`.
  - Giới hạn quyền hệ điều hành: Chặn các network port trái phép, ngăn rò rỉ credential.
- **Hành vi khi xung đột**: Nếu Level 4 (Prompt) hoặc Level 3 (Skill) yêu cầu làm điều mà Hook cấm, hệ thống **lập tức từ chối và báo lỗi vi phạm Hook Gate**.

### Level 2: Repository Hard Invariants (`AGENTS.md` / Project Anchors)
- **Bản chất**: Các ranh giới bất biến kiến trúc (Negative Space) và nguyên tắc cốt lõi được định vị trong Static Prefix Cache (~8.000 tokens).
- **Thẩm quyền**: Vượt trội hơn mọi hướng dẫn của Skill chuyên môn và yêu cầu runtime của người dùng, ngoại trừ trường hợp có User Approval đối với Type 1 decisions theo đúng quy trình ADR.
- **Phạm vi áp dụng**:
  - G1: Anti-Semantic Void (Cấm bịa đặt khi thiếu dữ kiện).
  - G2: Zero Placeholder (Cấm để lại TODO, stub code, mock data trên luồng chính).
  - G3: Type 1 Ceasefire (Dừng lại lập ADR nếu Risk Index $\ge 8$).
  - G4: Mechanical Proof Over Words (100% khẳng định phải có log kiểm chứng).
  - G5: Defensive Graceful Degradation (Cấm để lỗi module phụ làm sập luồng chính).

### Level 3: Active Domain Skills (`.agents/skills/<name>/SKILL.md`)
- **Bản chất**: Tri thức nghiệp vụ, quy trình chuyên biệt được đóng gói theo nguyên lý Progressive Disclosure (chỉ nạp khi được kích hoạt).
- **Thẩm quyền**: Chi phối phương pháp luận thực thi trong phạm vi nghiệp vụ của nó (ví dụ: BABOK taxonomy trong `ba-requirements-analyzer`, trade-off 6 chiều trong `technical-tradeoff-analyzer`).
- **Hành vi khi xung đột**:
  - Nếu hai Skill khác nhau đưa ra chỉ dẫn mâu thuẫn (ví dụ: BA skill yêu cầu hỏi sâu, Dev skill yêu cầu viết code ngay), Agent kích hoạt chế độ phân vai theo Behavioral Dispatcher.

### Level 4: Interactive User Runtime Prompts
- **Bản chất**: Các yêu cầu tác vụ, câu hỏi hoặc chỉ thị tức thời của người dùng trong phiên làm việc.
- **Thẩm quyền**: Có quyền chỉ định mục tiêu, phạm vi bài toán nhưng **KHÔNG ĐƯỢC PHÉP** ép Agent vi phạm Level 1 (Hooks) hoặc Level 2 (Invariants) mà không qua cơ chế xác nhận an toàn chính thức.

---

## 3. Quy Tắc Phân Xử Xung Đột Tự Động (Resolution Algorithm)

```python
def resolve_conflict(rule_a, rule_b):
    if rule_a.tier < rule_b.tier:
        winner = rule_a
        loser = rule_b
    elif rule_b.tier < rule_a.tier:
        winner = rule_b
        loser = rule_a
    else:
        # Cùng tầng thẩm quyền: Áp dụng nguyên tắc Cấm đoán mạnh hơn (Strict Wins)
        if rule_a.is_prohibition and not rule_b.is_prohibition:
            winner = rule_a
            loser = rule_b
        elif rule_b.is_prohibition and not rule_a.is_prohibition:
            winner = rule_b
            loser = rule_a
        else:
            return "MANUAL_DISAMBIGUATION_REQUIRED"

    return {
        "verdict": f"{winner.id} PREVAILS over {loser.id}",
        "reason": f"Level {winner.tier} takes precedence over Level {loser.tier}",
        "logged": True
    }
```
