/**
 * @file zalo-dom-observer.ts
 * @layer Infrastructure Layer (@infra/extraction)
 * @description Bộ quan sát biến đổi DOM thực tế (Realtime MutationObserver) trên trang Zalo Web (`chat.zalo.me`).
 *
 * Trách nhiệm chính:
 * - `start` / `stop`: Khởi chạy/dừng lắng nghe sự kiện thay đổi trên `document.body`.
 * - `scanContainer`: Quét toàn bộ DOM tin nhắn hiện tại, lọc rác sidebar/header, phân loại tin nhắn cũ (`position: 'top'`) khi lướt lên và tin mới (`position: 'bottom'`) khi nhận trực tiếp.
 * - `forceScanCurrentChat`: Ép quét lại thủ công và phát tín hiệu trích xuất dạng đơn (`onMessageExtracted`) lẫn dạng lô (`onMessagesBatchExtracted`).
 */

import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { MessageDeduplicator } from '@domain/message-extraction/services/deduplicator.service';
import type { IEventBus } from '@shared/kernel/event-bus.interface';
import { MESSAGE_EVENT_TYPES } from '@shared/contracts/events/message-events.contract';
import { parseActiveConversationName } from './zalo-header-parser';
import { getLeafMessageNodes } from './zalo-element-filter';
import { parseMessageNode, peekMessageId } from './zalo-message-parser';
import { Evlog } from '../logging';

export interface ZaloDomObserverOptions {
  onMessageExtracted?: (message: ZaloMessage) => void;
  onMessagesBatchExtracted?: (messages: ZaloMessage[]) => void;
  onConversationChanged?: (name: string) => void;
  eventBus?: IEventBus;
  isFullExtractionEnabled?: boolean;
}

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

  public isObserving(): boolean {
    return this.isRunning;
  }

  public setFullExtractionEnabled(enabled: boolean): void {
    this.options.isFullExtractionEnabled = enabled;
  }

  public clearCache(): void {
    this.deduplicator.clear();
  }

  public forceScanCurrentChat(clearCacheFirst = false): number {
    if (clearCacheFirst) {
      this.clearCache();
    }
    this.updateActiveConversation();

    return this.scanContainer();
  }

  private updateActiveConversation(): void {
    const name = parseActiveConversationName();
    if (name && name !== this.currentConversation) {
      const oldName = this.currentConversation;
      this.currentConversation = name;
      this.clearCache();
      Evlog.info('@infra/extraction', 'Active Zalo conversation changed', {
        oldConversation: oldName,
        newConversation: name,
      });
      this.options.onConversationChanged?.(name);
      this.options.eventBus?.publish(MESSAGE_EVENT_TYPES.CONVERSATION_CHANGED, {
        conversationId: name,
      });
    }
  }

  private scanContainer(): number {
    const elements = getLeafMessageNodes();
    const batch: ZaloMessage[] = [];

    const hasSeenBefore = this.deduplicator.size > 0;
    let encounteredSeenInThisScan = false;

    elements.forEach((el) => {
      const msgId = peekMessageId(el, this.currentConversation, this.deduplicator);

      if (msgId && this.deduplicator.isDuplicate(msgId)) {
        encounteredSeenInThisScan = true;
        return;
      }

      const position: 'top' | 'bottom' = hasSeenBefore && !encounteredSeenInThisScan ? 'top' : 'bottom';
      const message = parseMessageNode(el, this.currentConversation, this.deduplicator, position);

      if (message) {
        batch.push(message);
        this.options.eventBus?.publish(MESSAGE_EVENT_TYPES.MESSAGE_CAPTURED, {
          rawContent: message.rawText,
          senderId: message.sender,
          timestamp: Date.now(),
          conversationId: message.conversationName,
        });
        this.options.onMessageExtracted?.(message);
      }
    });

    if (batch.length > 0) {
      Evlog.info('@infra/extraction', 'Extracted new DOM messages batch', {
        newBatchCount: batch.length,
        conversation: this.currentConversation,
      });
      if (this.options.onMessagesBatchExtracted) {
        this.options.onMessagesBatchExtracted(batch);
      }
    }

    return batch.length;
  }
}
