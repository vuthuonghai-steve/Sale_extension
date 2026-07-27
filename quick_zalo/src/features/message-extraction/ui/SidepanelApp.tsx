import React, { useCallback } from 'react';
import { useExtractedMessages, useZaloTabStatus } from './hooks';
import { Header, SearchBar, MessageList } from './components';

export const SidepanelApp: React.FC = () => {
  const status = useZaloTabStatus();
  const {
    messages,
    searchTerm,
    setSearchTerm,
    clearMessages,
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
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Header status={status} onExport={handleExportClick} />
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClear={clearMessages}
      />
      <MessageList messages={messages} isConnected={status.isConnected} />
    </div>
  );
};
