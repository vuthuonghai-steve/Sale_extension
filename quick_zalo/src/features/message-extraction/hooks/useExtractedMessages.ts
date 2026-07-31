/**
 * @file useExtractedMessages.ts
 * @layer Feature Layer (@features/message-extraction/hooks)
 * @description React Custom Hook quản lý danh sách tin nhắn Zalo Web đã trích xuất.
 *
 * Trách nhiệm chính:
 * - `appendExtractedMessage` / `mergeExtractedMessages`: Ghép nối dữ liệu 2 chiều (nối `olderBatch` vào đầu trên `top`, nối `newerBatch` vào đầu dưới `bottom`), duy trì thứ tự хронологи chuẩn từ cũ đến mới.
 * - Lắng nghe sự kiện trích xuất từ `SidepanelBridgeService`.
 * - Cung cấp hàm lọc theo từ khóa tìm kiếm (`searchTerm`), làm sạch dữ liệu (`clearMessages`), trích xuất lại (`reExtractMessages`) và xuất file JSON (`handleExport`).
 * - Hỗ trợ giới hạn lưu trữ (10-15 tin nhắn mới nhất) khi feature toggle OFF, và lưu trữ không giới hạn khi ON.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import { SidepanelBridgeService } from '../services/sidepanel-bridge.service';
import { exportMessagesAsJson, buildExportFilename } from '../utils/export-json';
import { Evlog } from '@infra/logging';

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
  incoming: ZaloMessage[],
  maxCapacity?: number
): ZaloMessage[] {
  if (incoming.length === 0) {
    if (maxCapacity && maxCapacity > 0 && prev.length > maxCapacity) {
      return prev.slice(prev.length - maxCapacity);
    }
    return prev;
  }

  // Filter out any messages in prev belonging to a different conversation
  const firstIncomingConv = incoming[0]?.conversationName;
  const basePrev = firstIncomingConv
    ? prev.filter((p) => !p.conversationName || p.conversationName === firstIncomingConv)
    : prev;

  if (basePrev.length === 0) {
    if (maxCapacity && maxCapacity > 0 && incoming.length > maxCapacity) {
      const hasOnlyTop = incoming.every((m) => m.position === 'top');
      return hasOnlyTop
        ? incoming.slice(0, maxCapacity)
        : incoming.slice(incoming.length - maxCapacity);
    }
    return [...incoming];
  }

  const newIncoming = incoming.filter((item) => !basePrev.some((p) => p.id === item.id));
  if (newIncoming.length === 0) {
    if (maxCapacity && maxCapacity > 0 && basePrev.length > maxCapacity) {
      return basePrev.slice(basePrev.length - maxCapacity);
    }
    return basePrev;
  }

  const olderBatch: ZaloMessage[] = [];
  const newerBatch: ZaloMessage[] = [];

  for (const item of newIncoming) {
    if (item.position === 'top') {
      olderBatch.push(item);
    } else {
      newerBatch.push(item);
    }
  }

  const result = [...olderBatch, ...basePrev, ...newerBatch];

  if (maxCapacity && maxCapacity > 0 && result.length > maxCapacity) {
    // If only older messages (scrolling up) were added, keep top items
    if (olderBatch.length > 0 && newerBatch.length === 0) {
      return result.slice(0, maxCapacity);
    }
    // Otherwise (new messages at bottom), keep bottom items
    return result.slice(result.length - maxCapacity);
  }

  return result;
}

export function useExtractedMessages(isEnabled = true, maxLimitWhenDisabled = 15) {
  const [messages, setMessages] = useState<ZaloMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  useEffect(() => {
    const limit = isEnabled ? undefined : maxLimitWhenDisabled;
    Evlog.info('@features/message-extraction', 'useExtractedMessages listener mounted', {
      isEnabled,
      limit,
    });
    const unsubscribe = bridge.subscribeExtractedMessages(
      (newMsg) => {
        Evlog.debug('@features/message-extraction', 'Received single extracted message', {
          msgId: newMsg.id,
          conversationName: newMsg.conversationName,
          position: newMsg.position,
        });
        setMessages((prev) => mergeExtractedMessages(prev, [newMsg], limit));
      },
      (batch) => {
        Evlog.debug('@features/message-extraction', 'Received batch extracted messages', {
          batchCount: batch.length,
          conversationName: batch[0]?.conversationName,
        });
        setMessages((prev) => mergeExtractedMessages(prev, batch, limit));
      },
      (convName) => {
        Evlog.info('@features/message-extraction', 'Resetting messages state due to conversation change', {
          newConversation: convName,
        });
        setMessages([]);
      }
    );

    return () => unsubscribe();
  }, [isEnabled, maxLimitWhenDisabled]);

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
