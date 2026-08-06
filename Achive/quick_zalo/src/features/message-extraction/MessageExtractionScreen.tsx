import React, { useCallback } from 'react';
import { useExtractedMessages, useZaloTabStatus } from './hooks';
import { Header, SearchBar, MessageList } from './components';
import { useModuleManagement } from '../../ui/hooks/use-module-management';

/**
 * MessageExtractionScreen — Screen đại diện chính của feature Message Extraction.
 */
export const MessageExtractionScreen: React.FC = () => {
  const status = useZaloTabStatus();
  const { isModuleEnabled, toggleModule } = useModuleManagement();
  const isEnabled = isModuleEnabled('message-extraction');

  const {
    messages,
    searchTerm,
    setSearchTerm,
    isExtracting,
    clearMessages,
    reExtractMessages,
    handleExport,
  } = useExtractedMessages(isEnabled);

  const handleExportClick = useCallback(() => {
    return handleExport(status.activeConversation);
  }, [handleExport, status.activeConversation]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        backgroundColor: '#f5f5f5',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Header
        status={status}
        onExport={handleExportClick}
        onReExtract={reExtractMessages}
        isExtracting={isExtracting}
        isEnabled={isEnabled}
      />

      {!isEnabled && (
        <div
          style={{
            margin: '8px 12px 0 12px',
            padding: '10px 14px',
            backgroundColor: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#d46b08',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span>
              Module đang <strong>TẠM DỪNG</strong> (Đang chạy chế độ <strong>Trích xuất tạm thời - tối đa 15 tin</strong>).
            </span>
          </div>
          <button
            onClick={() => void toggleModule('message-extraction', true)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#fa8c16',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Bật lại đầy đủ
          </button>
        </div>
      )}

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClear={clearMessages}
      />
      <MessageList messages={messages} isConnected={status.isConnected} />
    </div>
  );
};

// Aliased export cho tương thích ngược
export { MessageExtractionScreen as SidepanelApp };
