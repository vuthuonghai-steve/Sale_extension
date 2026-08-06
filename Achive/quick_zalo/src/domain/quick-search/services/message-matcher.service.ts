/**
 * @file message-matcher.service.ts
 * @layer Domain Layer (@domain/quick-search/services)
 * @description Service matching text selection fragment to full BufferedMessageEntity.
 */

import type { BufferedMessageEntity } from '../entities/buffered-message.entity';

export class MessageMatcherService {
  public match(
    fragment: string,
    targetElement: HTMLElement | null,
    buffer: BufferedMessageEntity[]
  ): BufferedMessageEntity | null {
    const sanitizedSnippet = fragment.trim().toLowerCase();
    if (!sanitizedSnippet) {
      return null;
    }

    if (targetElement) {
      const chatItem = targetElement.closest?.('.chat-item') as HTMLElement | null;
      if (chatItem) {
        const msgId = chatItem.getAttribute('data-id');
        if (msgId) {
          const matchById = buffer.find((item) => item.id === msgId);
          if (matchById) {
            return matchById;
          }
        }

        const chatItemText = (chatItem.textContent || '').trim().toLowerCase();
        const matchesInChatItem = buffer.filter(
          (item) =>
            item.rawContent.toLowerCase().includes(sanitizedSnippet) ||
            item.sanitizedContent.includes(sanitizedSnippet)
        );

        if (matchesInChatItem.length > 0) {
          const exactChatItemMatch = matchesInChatItem.find(
            (item) => item.sanitizedContent === chatItemText || chatItemText.includes(item.sanitizedContent)
          );
          if (exactChatItemMatch) {
            return exactChatItemMatch;
          }
          return matchesInChatItem[0];
        }
      }
    }

    return (
      buffer.find(
        (item) =>
          item.rawContent.toLowerCase().includes(sanitizedSnippet) ||
          item.sanitizedContent.includes(sanitizedSnippet)
      ) ?? null
    );
  }

  public extractOnTheFlyFromDOM(targetElement: HTMLElement | null): BufferedMessageEntity | null {
    if (!targetElement) {
      return null;
    }

    const chatItem = targetElement.closest?.('.chat-item') as HTMLElement | null;
    if (!chatItem) {
      return null;
    }

    const id = chatItem.getAttribute('data-id') || `msg_${Date.now()}`;
    const conversationId = chatItem.getAttribute('data-conversation-id') || 'conv_default';
    const senderId = chatItem.getAttribute('data-sender-id') || 'sender_default';
    const rawContent = (chatItem.textContent || '').trim();
    const sanitizedContent = rawContent.toLowerCase();
    const hash = `hash_${id}`;

    return {
      id,
      conversationId,
      senderId,
      rawContent,
      sanitizedContent,
      hash,
      capturedAt: Date.now(),
    };
  }
}
