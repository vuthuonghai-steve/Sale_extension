import React from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';

interface MessageCardProps {
  message: ZaloMessage;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: message.isSelf ? '#f0f5ff' : '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong
            style={{
              fontSize: '13px',
              color: message.isSelf ? '#1890ff' : '#262626',
            }}
          >
            {message.sender}
          </strong>
          {message.conversationName && (
            <span
              style={{
                fontSize: '10px',
                color: '#8c8c8c',
                backgroundColor: '#f5f5f5',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {message.conversationName}
            </span>
          )}
        </div>

        <span style={{ fontSize: '11px', color: '#bfbfbf' }}>{message.timestamp}</span>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#333333',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.rawText}
      </div>
    </div>
  );
};

