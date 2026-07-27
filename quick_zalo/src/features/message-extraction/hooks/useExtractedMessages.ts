/**
 * @file useExtractedMessages.ts
 * @layer Feature Layer (@features/message-extraction/hooks)
 * @description React Custom Hook quản lý danh sách tin nhắn Zalo Web đã trích xuất.
 *
 * Trách nhiệm chính:
 * - `appendExtractedMessage` / `mergeExtractedMessages`: Ghép nối dữ liệu 2 chiều (nối `olderBatch` vào đầu trên `top`, nối `newerBatch` vào đầu dưới `bottom`), duy trì thứ tự хронологи chuẩn từ cũ đến mới.
 * - Lắng nghe sự kiện trích xuất từ `SidepanelBridgeService`.
 * - Cung cấp hàm lọc theo từ khóa tìm kiếm (`searchTerm`), làm sạch dữ liệu (`clearMessages`), trích xuất lại (`reExtractMessages`) và xuất file JSON (`handleExport`).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { SidepanelBridgeService } from '../services/sidepanel-bridge.service';
import { exportMessagesAsJson, buildExportFilename } from '../utils/export-json';

const bridge = new SidepanelBridgeService();

export function appendExtractedMessage(prev: ZaloMessage[], newMsg: ZaloMessage): ZaloMessage[] {
  if (prev.some((m) => m.id === newMsg.id)) {
    return prev;
  }
  if (newMsg.position === 'top') {
    return [newMsg, ...prev];
  }
  return [...prev, newMsg];
}

export function mergeExtractedMessages(
  prev: ZaloMessage[],
  incoming: ZaloMessage[]
): ZaloMessage[] {
  if (incoming.length === 0) return prev;
  if (prev.length === 0) return [...incoming];

  const newIncoming = incoming.filter((item) => !prev.some((p) => p.id === item.id));
  if (newIncoming.length === 0) return prev;

  const olderBatch: ZaloMessage[] = [];
  const newerBatch: ZaloMessage[] = [];

  for (const item of newIncoming) {
    if (item.position === 'top') {
      olderBatch.push(item);
    } else {
      newerBatch.push(item);
    }
  }

  return [...olderBatch, ...prev, ...newerBatch];
}

export function useExtractedMessages() {
  const [messages, setMessages] = useState<ZaloMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = bridge.subscribeExtractedMessages(
      (newMsg) => setMessages((prev) => mergeExtractedMessages(prev, [newMsg])),
      (batch) => setMessages((prev) => mergeExtractedMessages(prev, batch))
    );

    return () => unsubscribe();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    void bridge.clearMessageCache();
  }, []);

  const reExtractMessages = useCallback(async () => {
    setIsExtracting(true);
    setMessages([]);
    const startTime = Date.now();
    try {
      await bridge.reExtractMessages();
    } finally {
      const elapsed = Date.now() - startTime;
      const minDelay = Math.max(0, 600 - elapsed);
      setTimeout(() => {
        setIsExtracting(false);
      }, minDelay);
    }
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
    isExtracting,
    clearMessages,
    reExtractMessages,
    handleExport,
  };
}
