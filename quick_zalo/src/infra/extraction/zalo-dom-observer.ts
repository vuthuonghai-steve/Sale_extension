import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { MessageDeduplicator } from '@domain/message-extraction/services/deduplicator.service';

export interface ZaloDomObserverOptions {
  onMessageExtracted: (message: ZaloMessage) => void;
  onConversationChanged?: (name: string) => void;
}

const SELECTOR_MESSAGE_NODES = [
  '[id^="msg_"]',
  '[id^="msg-"]',
  '.chat-item',
  '.grid-message-item',
  '.msg-item',
  '.message-view',
  '.msg-view',
  '[class*="chat-item"]',
  '[class*="msg-item"]',
  '[class*="chat-message"]',
  '.card-msg',
  'div[data-id]',
].join(', ');

export class ZaloDomObserver {
  private observer: MutationObserver | null = null;
  private deduplicator = new MessageDeduplicator(2000);
  private options: ZaloDomObserverOptions;
  private currentConversation = '';
  private isRunning = false;

  constructor(options: ZaloDomObserverOptions) {
    this.options = options;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.updateActiveConversation();
    this.scanContainer();

    this.observer = new MutationObserver(() => {
      this.updateActiveConversation();
      this.scanContainer();
    });

    const targetNode = document.body;
    if (targetNode) {
      this.observer.observe(targetNode, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isRunning = false;
  }

  public getActiveConversation(): string {
    return this.currentConversation;
  }

  public forceScanCurrentChat(): number {
    this.updateActiveConversation();

    const messageElements = document.querySelectorAll(SELECTOR_MESSAGE_NODES);

    let extractedCount = 0;
    messageElements.forEach((el) => {
      const isNew = this.processMessageNode(el as HTMLElement);
      if (isNew) {
        extractedCount++;
      }
    });

    return extractedCount;
  }

  private updateActiveConversation(): void {
    const titleEl =
      document.querySelector('.header-title') ||
      document.querySelector('#header-title') ||
      document.querySelector('.chat-header .name-title') ||
      document.querySelector('.chat-header') ||
      document.querySelector('[data-id="header-title"]');

    if (titleEl) {
      const name = titleEl.textContent?.trim() || '';
      if (name && name !== this.currentConversation) {
        this.currentConversation = name;
        this.options.onConversationChanged?.(name);
      }
    }
  }

  private scanContainer(): void {
    const messageElements = document.querySelectorAll(SELECTOR_MESSAGE_NODES);

    messageElements.forEach((el) => {
      this.processMessageNode(el as HTMLElement);
    });
  }

  private processMessageNode(node: HTMLElement): boolean {
    const textEl =
      node.querySelector('.text-content') ||
      node.querySelector('.msg-text') ||
      node.querySelector('.plain-text') ||
      node.querySelector('.text-quote') ||
      node.querySelector('[class*="text-content"]') ||
      node.querySelector('[class*="plain-text"]') ||
      node.querySelector('.rendered-break-line') ||
      node.querySelector('.text') ||
      node;

    const rawText = textEl.textContent?.trim() || '';
    if (!rawText || rawText.length < 2) return false;

    // Filter out pure timestamps like "18:00" or status text "Đã nhận" if node was just timestamp
    if (/^\d{1,2}:\d{2}$/.test(rawText) || rawText === 'Đã nhận' || rawText === 'Đã gửi') {
      return false;
    }

    let msgId =
      node.getAttribute('data-id') ||
      node.getAttribute('data-msg-id') ||
      node.id;

    // Detect if message is sent by me
    const classNameStr = typeof node.className === 'string' ? node.className : '';
    const isMe =
      node.classList.contains('me') ||
      node.classList.contains('msg-item--me') ||
      node.classList.contains('chat-item--me') ||
      node.querySelector('.me') !== null ||
      classNameStr.includes('--me') ||
      classNameStr.includes('me-msg') ||
      classNameStr.includes('sent');

    const senderEl =
      node.querySelector('.sender-name') ||
      node.querySelector('.avatar-name') ||
      node.querySelector('[class*="sender"]');

    const sender =
      senderEl?.textContent?.trim() ||
      (isMe ? 'Bạn (Tôi)' : this.currentConversation || 'Đối phương');

    const timeEl =
      node.querySelector('.msg-time') ||
      node.querySelector('.time-stamp') ||
      node.querySelector('[class*="time"]') ||
      node.querySelector('[title]');

    const timestampStr =
      timeEl?.textContent?.trim() ||
      timeEl?.getAttribute('title') ||
      new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (!msgId) {
      msgId = this.deduplicator.generateHash(this.currentConversation, sender, timestampStr, rawText);
    }

    if (this.deduplicator.isDuplicate(msgId)) {
      return false;
    }

    this.deduplicator.markSeen(msgId);

    const zaloMsg: ZaloMessage = {
      id: msgId,
      conversationName: this.currentConversation || 'Cuộc trò chuyện Zalo',
      sender,
      isSelf: isMe,
      timestamp: timestampStr,
      rawText,
    };

    this.options.onMessageExtracted(zaloMsg);
    return true;
  }
}
