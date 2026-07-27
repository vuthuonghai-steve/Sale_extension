# Context Analysis: Fix Zalo DOM Observer Message Extraction Errors

> **Feature**: `zalo-dom-observer-fix`  
> **Date**: 2026-07-28  
> **Status**: Scoped with DevTools Screenshot Evidence

---

## 1. Problem Summary (Tóm tắt Vấn đề)

Dựa trên ảnh chụp Chrome DevTools Element Inspector thực tế từ Zalo Web (`chat.zalo.me`):
1. **Lỗi không trích xuất được tin nhắn thực tế:**
   - ID chính xác của khung tin nhắn trên Zalo Web là `message_frame_<id>` (ví dụ: `id="message_frame_1785149597881"`), chứ KHÔNG PHẢI `msg_` hay `card-msg`.
   - Thẻ chứa nội dung tin nhắn có attribute `data-component="message-text-content"`, `data-component="text-container"`, `class="text-message__container"`, hoặc `span.text`.
2. **Lỗi vơ vét tin nhắn rác từ Sidebar & Thanh Pinned Header:**
   - Selector loãng quét dính danh sách cuộc trò chuyện bên trái (Left Sidebar) và thanh Ghim tin nhắn trên cùng (`Tin nhắn Nguyễn Đán... 1 ghim`).

---

## 2. Updated Zalo Web DOM Structure (Kiến trúc DOM Thực tế từ DevTools)

```html
<div class="message-content-render focused-background">
  <div id="message_frame_1785149597881" class="last-msg card shadow-bubble message-frame focused-item" data-component="message-content-view">
    <div data-id="div_DisabledTargetEventLayer">
      <div class="message-action">
        <div id="text-mCntr_..." class="text-message__container" data-id="div_ReceivedMsg_Text">
          <div>
            <div class="overflow-hidden" data-component="message-text-content">
              <span id="mtc-..." data-component="text-container">
                <span class="text">mang ga gối qua đây</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 3. Key Findings & Fix Targets (Mục tiêu Chỉnh sửa)

1. **Khung chứa Chat (Main Chat View Only):**
   - Giới hạn vùng quét trong khung chat chính (loại bỏ Sidebar trái `.left-panel`, `.conv-item` và Pinned Header `.pinned-board`).
2. **Message Node Selectors Chuẩn Zalo Web:**
   - `[id^="message_frame_"]`
   - `[id^="message-frame"]`
   - `.message-frame`
   - `[data-component="message-content-view"]`
   - `.text-message__container`
3. **Text Extraction Selectors:**
   - `[data-component="text-container"]`
   - `[data-component="message-text-content"]`
   - `.text-message__container`
   - `span.text`
4. **Phân loại Sender & `isMe`:**
   - `data-id="div_SentMsg_Text"` hoặc `data-id="div_SentMsg"` $\rightarrow$ `isSelf = true`
   - `data-id="div_ReceivedMsg_Text"` hoặc `data-id="div_ReceivedMsg"` $\rightarrow$ `isSelf = false`
