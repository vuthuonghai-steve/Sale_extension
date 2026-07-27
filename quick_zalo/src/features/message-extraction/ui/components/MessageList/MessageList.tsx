import React from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { MessageCard } from './MessageCard';
import { UI_CONSTANTS } from '../../lib/constants';

interface MessageListProps {
  messages: ZaloMessage[];
  isConnected: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isConnected }) => {
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
    </div>
  );
};
