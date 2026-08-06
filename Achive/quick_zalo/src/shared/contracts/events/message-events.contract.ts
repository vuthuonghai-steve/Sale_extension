/**
 * @file message-events.contract.ts
 * @layer Shared Contracts (@shared/contracts/events)
 * @description Hợp đồng sự kiện in-memory giữa Module Extraction và Module Quick Search (Task 1).
 */

export const MESSAGE_EVENT_TYPES = {
  MESSAGE_CAPTURED: 'message.captured',
  CONVERSATION_CHANGED: 'conversation.changed',
} as const;

export type MessageEventType = (typeof MESSAGE_EVENT_TYPES)[keyof typeof MESSAGE_EVENT_TYPES];

export interface MessageCapturedPayload {
  rawContent: string;
  senderId: string;
  timestamp: number;
  conversationId: string;
}

export interface ConversationChangedPayload {
  conversationId: string;
}
