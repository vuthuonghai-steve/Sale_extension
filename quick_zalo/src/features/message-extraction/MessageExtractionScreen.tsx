import React, { useCallback } from 'react';
import { useExtractedMessages, useZaloTabStatus } from './hooks';
import { Header, SearchBar, MessageList } from './components';

/**
 * MessageExtractionScreen — Screen đại diện chính của feature Message Extraction.
 */
export const MessageExtractionScreen: React.FC = () => {
  const status = useZaloTabStatus();
  const {
    messages,
    searchTerm,
    setSearchTerm,
    isExtracting,
    clearMessages,
    reExtractMessages,
    handleExport,
  } = useExtractedMessages();

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
      />
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
