/**
 * @file MessageList.tsx
 * @layer Feature Layer (@features/message-extraction/components/MessageList)
 * @description React Component hiển thị danh sách các thẻ tin nhắn (`MessageCard`) trong giao diện Sidepanel.
 *
 * Trách nhiệm chính:
 * - Hiển thị trạng thái rỗng/chờ tab Zalo khi chưa kết nối (`NOT_ZALO_TAB`) hoặc chưa có tin nhắn (`NO_MESSAGES`).
 * - Render mảng danh sách `ZaloMessage` theo thứ tự từ cũ đến mới.
 * - Tự động cuộn mượt (smooth scroll) xuống đáy danh sách (`messagesEndRef`) mỗi khi có tin nhắn mới.
 */

import React, { useEffect, useRef } from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { MessageCard } from './MessageCard';
import { UI_CONSTANTS } from '../../lib/constants';

interface MessageListProps {
  messages: ZaloMessage[];
  isConnected: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isConnected }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (!isConnected) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: '#8c8c8c',
          fontSize: '13px',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
        <p style={{ margin: 0 }}>{UI_CONSTANTS.NOT_ZALO_TAB}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: '#8c8c8c',
          fontSize: '13px',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
        <p style={{ margin: 0 }}>{UI_CONSTANTS.NO_MESSAGES}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
