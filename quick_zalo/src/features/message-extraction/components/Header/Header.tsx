import React, { useState, useCallback } from 'react';
import type { ZaloTabStatus } from '../../types/sidepanel-ui.types';
import { UI_CONSTANTS } from '../../lib/constants';

interface HeaderProps {
  status: ZaloTabStatus;
  onExport: () => string | null;
  onReExtract?: () => void;
  isExtracting?: boolean;
  isEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onExport,
  onReExtract,
  isExtracting = false,
  isEnabled = true,
}) => {
  const [toast, setToast] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const result = onExport();
    if (result) {
      setToast(result);
      setTimeout(() => setToast(null), 2500);
    }
  }, [onExport]);

  return (
    <header
      style={{
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes quick-zalo-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0068ff' }}>
            {UI_CONSTANTS.APP_TITLE}
          </h2>
          <span style={{ fontSize: '11px', color: '#8c8c8c' }}>{UI_CONSTANTS.SUBTITLE}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Re-extract button with loading state */}
          <button
            onClick={onReExtract}
            disabled={isExtracting || !status.isConnected || !isEnabled}
            title={isEnabled ? "Trích xuất lại tin nhắn từ khung chat Zalo hiện tại" : "Module hiện đang bị tắt"}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: isExtracting || !isEnabled ? '#f5f5f5' : '#0068ff',
              color: isExtracting || !isEnabled ? '#bfbfbf' : '#ffffff',
              border: `1px solid ${isExtracting || !isEnabled ? '#d9d9d9' : '#0068ff'}`,
              borderRadius: '6px',
              cursor: isExtracting || !status.isConnected || !isEnabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1,
              opacity: status.isConnected && isEnabled ? 1 : 0.6,
              transition: 'all 0.2s ease',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: isExtracting ? 'quick-zalo-spin 0.8s linear infinite' : 'none',
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            {isExtracting ? 'Đang trích xuất...' : 'Trích xuất lại'}
          </button>

          {/* Export JSON button */}
          <button
            onClick={handleExport}
            disabled={!isEnabled}
            title={isEnabled ? "Xuất tất cả tin nhắn ra file JSON" : "Module hiện đang bị tắt"}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: isEnabled ? '#ffffff' : '#f5f5f5',
              color: isEnabled ? '#0068ff' : '#bfbfbf',
              border: `1px solid ${isEnabled ? '#91caff' : '#d9d9d9'}`,
              borderRadius: '6px',
              cursor: isEnabled ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1,
              opacity: isEnabled ? 1 : 0.6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export JSON
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '12px',
              backgroundColor: status.isConnected ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${status.isConnected ? '#b7eb8f' : '#ffccc7'}`,
              fontSize: '11px',
              fontWeight: 500,
              color: status.isConnected ? '#52c41a' : '#ff4d4f',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: status.isConnected ? '#52c41a' : '#ff4d4f',
              }}
            />
            {status.isConnected ? 'Zalo Connected' : 'Chưa mở Zalo'}
          </div>
        </div>
      </div>

      {status.isConnected && status.activeConversation && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91caff',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#003eb3',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <strong style={{ fontWeight: 600 }}>Hội thoại:</strong>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {status.activeConversation}
          </span>
        </div>
      )}

      {/* Empty/toast notification */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            padding: '6px 14px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#ff4d4f',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          {toast}
        </div>
      )}
    </header>
  );
};
