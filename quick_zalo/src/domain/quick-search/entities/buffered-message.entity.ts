/**
 * @file buffered-message.entity.ts
 * @layer Domain Layer (@domain/quick-search/entities)
 * @description Entity tin nhắn đầy đủ lưu trong Ring Buffer RAM (N=10) của Quick Search.
 */

export interface BufferedMessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  rawContent: string;
  sanitizedContent: string;
  hash: string;
  capturedAt: number;
}
