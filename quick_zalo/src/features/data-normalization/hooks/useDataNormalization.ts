import { useState, useEffect, useCallback } from 'react';
import { NormalizedMessage, IngestionMetrics, RawJsonInputFile } from '../../../domain/data-normalization/entities/normalized-message.entity';
import { DataNormalizationService } from '../../../domain/data-normalization/services/normalization.service';
import { MessageDeduplicationService } from '../../../domain/data-normalization/services/deduplication.service';
import { DexieMessageRepository } from '../../../infra/storage/dexie-message-repository.adapter';

const normalizer = new DataNormalizationService();
const deduplicator = new MessageDeduplicationService(normalizer);
const repo = new DexieMessageRepository();

export function useDataNormalization() {
  const [messages, setMessages] = useState<NormalizedMessage[]>([]);
  const [metrics, setMetrics] = useState<IngestionMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [elevatorFilter, setElevatorFilter] = useState<boolean | undefined>(undefined);

  const loadStoredMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await repo.findAll({
      searchQuery: searchQuery || undefined,
      district: districtFilter || undefined,
      hasElevator: elevatorFilter,
    });

    if (result.isOk) {
      setMessages(result.value);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  }, [searchQuery, districtFilter, elevatorFilter]);

  useEffect(() => {
    loadStoredMessages();
  }, [loadStoredMessages]);

  const importJsonFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const jsonData: RawJsonInputFile = JSON.parse(text);

      if (!jsonData || !Array.isArray(jsonData.messages)) {
        throw new Error('Cấu trúc file JSON không hợp lệ! File cần chứa mảng "messages".');
      }

      // Stage 1: File In-memory Deduplication
      const stage1 = deduplicator.deduplicateFileInput(jsonData.messages);

      // Stage 2: Database Deduplication & Persistence
      const saveResult = await repo.saveBatch(stage1.uniqueMessages, stage1.dupesInFile);

      if (saveResult.isOk) {
        setMetrics(saveResult.value.metrics);
        await loadStoredMessages();
      } else {
        setError(saveResult.error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định khi nạp file JSON');
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu trong IndexedDB?')) {
      setLoading(true);
      await repo.clearAll();
      setMetrics(null);
      await loadStoredMessages();
      setLoading(false);
    }
  };

  return {
    messages,
    metrics,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    elevatorFilter,
    setElevatorFilter,
    importJsonFile,
    clearStorage,
    refresh: loadStoredMessages,
  };
}
