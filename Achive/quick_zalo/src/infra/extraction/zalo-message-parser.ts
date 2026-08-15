/**
 * @file zalo-message-parser.ts
 * @layer Infrastructure Layer (@infra/extraction)
 * @description Trình phân tích cú pháp DOM của từng Node tin nhắn Zalo Web.
 *
 * Trách nhiệm chính:
 * - `extractRawText`: Bóc tách văn bản thô từ DOM node, loại bỏ thời gian, tên avatar, nút reaction rác.
 * - `peekMessageId`: Đọc/sinh hash ID định danh duy nhất cho tin nhắn để kiểm tra trùng lặp trước khi parse đầy đủ.
 * - `parseMessageNode`: Chuyển đổi DOM node thành đối tượng entity `ZaloMessage` chuẩn, xác định `isSelf` (người gửi/bạn) và gán vị trí `position`.
 */

import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import type { MessageDeduplicator } from '@domain/message-extraction/services/deduplicator.service';


export function extractRawText(node: HTMLElement): string {
  let textEl: Element | null = null;

  if (
    node.matches &&
    node.matches(
      '[data-component="text-container"], [data-component="message-text-content"], .text-message__container, [id^="mtc-"], [id^="text-mCntr_"]'
    )
  ) {
    textEl = node;
  } else {
    textEl =
      node.querySelector('[data-component="text-container"]') ||
      node.querySelector('[data-component="message-text-content"]') ||
      node.querySelector('span.text') ||
      node.querySelector('.text-message__container') ||
      node.querySelector('.text-content') ||
      node.querySelector('.msg-text') ||
      node.querySelector('.plain-text') ||
      node.querySelector('.rendered-break-line') ||
      node.querySelector('[class*="text-content"]') ||
      node.querySelector('[class*="plain-text"]');
  }

  const textSource: HTMLElement = (textEl as HTMLElement) || node;

  const clone = textSource.cloneNode(true) as HTMLElement;
  const elementsToRemove = clone.querySelectorAll(
    '.msg-time, .time-stamp, .sender-name, .avatar-name, .reaction-btn, .status-text, .message-reaction-container, .reacts-list, .total-reacts, .reaction-emoji-list, [class*="time"], [class*="sender"], [class*="reaction"], [class*="reacts"], [class*="status"]'
  );
  elementsToRemove.forEach((el) => el.remove());

  return clone.textContent?.trim() || '';
}

export function peekMessageId(
  node: HTMLElement,
  currentConversation: string,
  deduplicator: MessageDeduplicator
): string {
  const rawText = extractRawText(node);
  if (!rawText || rawText.length < 1) return '';

  const frameEl = node.closest(
    '[id^="message_frame_"], [id^="message-frame"], [id^="bb_msg_id_"], [id^="text-mCntr_"], [id^="msg_"], [id^="msg-"], [data-component="message-content-view"], [data-component="bubble-message"]'
  );

  const qid =
    node.getAttribute('data-qid') ||
    node.querySelector('[data-qid]')?.getAttribute('data-qid') ||
    node.closest('[data-qid]')?.getAttribute('data-qid') ||
    '';

  const dataId =
    node.getAttribute('data-id') ||
    node.querySelector('[data-id]')?.getAttribute('data-id') ||
    node.closest('[data-id]')?.getAttribute('data-id') ||
    '';

  const msgId =
    qid ||
    frameEl?.id ||
    node.getAttribute('id') ||
    dataId ||
    node.getAttribute('data-msg-id') ||
    '';

  if (msgId) return msgId;

  const timeEl =
    node.querySelector('.msg-time') ||
    node.querySelector('.time-stamp') ||
    node.querySelector('[class*="time"]') ||
    node.querySelector('[title]');

  const timestampStr =
    timeEl?.textContent?.trim() ||
    timeEl?.getAttribute('title') ||
    '';

  return deduplicator.generateHash(currentConversation, '', timestampStr, rawText);
}

export function parseMessageNode(
  node: HTMLElement,
  currentConversation: string,
  deduplicator: MessageDeduplicator,
  position: 'top' | 'bottom' = 'bottom'
): ZaloMessage | null {
  const rawText = extractRawText(node);
  if (!rawText || rawText.length < 1) return null;

  // Filter out pure timestamps or status text
  if (
    /^\d{1,2}:\d{2}$/.test(rawText) ||
    rawText === 'Đã nhận' ||
    rawText === 'Đã gửi' ||
    rawText === 'Đã xem' ||
    rawText === 'Trả lời'
  ) {
    return null;
  }

  const frameEl = node.closest(
    '[id^="message_frame_"], [id^="message-frame"], [id^="bb_msg_id_"], [id^="text-mCntr_"], [id^="msg_"], [id^="msg-"], [data-component="message-content-view"], [data-component="bubble-message"]'
  );

  const qid =
    node.getAttribute('data-qid') ||
    node.querySelector('[data-qid]')?.getAttribute('data-qid') ||
    node.closest('[data-qid]')?.getAttribute('data-qid') ||
    '';

  const dataId =
    node.getAttribute('data-id') ||
    node.querySelector('[data-id]')?.getAttribute('data-id') ||
    node.closest('[data-id]')?.getAttribute('data-id') ||
    '';

  let msgId =
    qid ||
    frameEl?.id ||
    node.getAttribute('id') ||
    dataId ||
    node.getAttribute('data-msg-id') ||
    '';

  const classNameStr = typeof node.className === 'string' ? node.className : '';
  const closestDataId =
    node.getAttribute('data-id') ||
    node.closest('[data-id]')?.getAttribute('data-id') ||
    '';

  const isMe =
    closestDataId.includes('SentMsg') ||
    node.classList.contains('me') ||
    node.classList.contains('msg-item--me') ||
    node.classList.contains('chat-item--me') ||
    node.querySelector('.me') !== null ||
    node.closest('.me') !== null ||
    node.closest('.chat-item--me') !== null ||
    node.closest('.message-wrapper--me') !== null ||
    node.closest('.msg-item--me') !== null ||
    node.closest('[class*="--me"]') !== null ||
    node.closest('[class*="me-msg"]') !== null ||
    classNameStr.includes('--me') ||
    classNameStr.includes('me-msg');

  const senderEl =
    node.querySelector('.sender-name') ||
    node.querySelector('.avatar-name') ||
    node.querySelector('[class*="sender-name"]') ||
    node.closest('.chat-item')?.querySelector('.sender-name') ||
    node.closest('.chat-item')?.querySelector('.avatar-name');

  let sender = senderEl?.textContent?.trim() || '';

  if (
    sender === 'Đã nhận' ||
    sender === 'Đã gửi' ||
    /^\d{1,2}:\d{2}$/.test(sender)
  ) {
    sender = '';
  }

  if (!sender) {
    sender = isMe ? 'Bạn (Tôi)' : currentConversation || 'Đối phương';
  }

  const timeEl =
    node.querySelector('.msg-time') ||
    node.querySelector('.time-stamp') ||
    node.querySelector('[class*="time"]') ||
    node.querySelector('[title]') ||
    node.closest('.chat-item')?.querySelector('.msg-time') ||
    node.closest('.chat-message')?.querySelector('.-send-time');

  const timestampStr =
    timeEl?.textContent?.trim() ||
    timeEl?.getAttribute('title') ||
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (!msgId) {
    msgId = deduplicator.generateHash(
      currentConversation,
      sender,
      timestampStr,
      rawText
    );
  }

  if (deduplicator.isDuplicate(msgId)) {
    return null;
  }

  deduplicator.markSeen(msgId);

  return {
    id: msgId,
    conversationName: currentConversation || 'Cuộc trò chuyện Zalo',
    sender,
    isSelf: isMe,
    timestamp: timestampStr,
    rawText,
    position,
  };
}

