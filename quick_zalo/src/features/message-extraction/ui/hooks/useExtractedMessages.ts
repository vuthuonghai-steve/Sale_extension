import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { SidepanelBridgeService } from '../services/sidepanel-bridge.service';
import { exportMessagesAsJson, buildExportFilename } from '../utils/export-json';

const bridge = new SidepanelBridgeService();

export function useExtractedMessages() {
  const [messages, setMessages] = useState<ZaloMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const unsubscribe = bridge.subscribeExtractedMessages((newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [newMsg, ...prev];
      });
    });

    return () => unsubscribe();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;

    const term = searchTerm.toLowerCase();
    return messages.filter((m) => {
      const matchesContent = m.rawText.toLowerCase().includes(term);
      const matchesSender = m.sender.toLowerCase().includes(term);
      const matchesConversation = m.conversationName.toLowerCase().includes(term);
      return matchesContent || matchesSender || matchesConversation;
    });
  }, [messages, searchTerm]);

  const handleExport = useCallback(
    (conversationName: string): string | null => {
      if (messages.length === 0) {
        return 'Chưa có tin nhắn nào để xuất.';
      }

      const filename = buildExportFilename(conversationName);
      exportMessagesAsJson(messages, filename);
      return null;
    },
    [messages],
  );

  return {
    messages: filteredMessages,
    searchTerm,
    setSearchTerm,
    clearMessages,
    handleExport,
  };
}
