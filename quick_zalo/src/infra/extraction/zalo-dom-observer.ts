import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { MessageDeduplicator } from '@domain/message-extraction/services/deduplicator.service';
import { parseActiveConversationName } from './zalo-header-parser';
import { getLeafMessageNodes } from './zalo-element-filter';
import { parseMessageNode } from './zalo-message-parser';

export interface ZaloDomObserverOptions {
  onMessageExtracted: (message: ZaloMessage) => void;
  onConversationChanged?: (name: string) => void;
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

  public clearCache(): void {
    this.deduplicator.clear();
  }

  public forceScanCurrentChat(clearCacheFirst = false): number {
    if (clearCacheFirst) {
      this.clearCache();
    }
    this.updateActiveConversation();

    const elements = getLeafMessageNodes();

    let extractedCount = 0;
    elements.forEach((el) => {
      if (this.processMessageNode(el)) {
        extractedCount++;
      }
    });

    return extractedCount;
  }

  private updateActiveConversation(): void {
    const name = parseActiveConversationName();
    if (name && name !== this.currentConversation) {
      this.currentConversation = name;
      this.options.onConversationChanged?.(name);
    }
  }

  private scanContainer(): void {
    const elements = getLeafMessageNodes();

    elements.forEach((el) => {
      this.processMessageNode(el);
    });
  }

  private processMessageNode(node: HTMLElement): boolean {
    const message = parseMessageNode(node, this.currentConversation, this.deduplicator);
    if (!message) return false;

    this.options.onMessageExtracted(message);
    return true;
  }
}
