import { useState, useEffect, useCallback } from 'react';
import type { NormalizedListing, TemplateFamily } from '../../../domain/data-normalization/entities/normalized-listing.entity';
import { ImportSession } from '../../../domain/data-normalization/entities/import-session.entity';
import { RawJsonInputFile } from '../../../domain/data-normalization/entities/normalized-message.entity';
import { DataNormalizationService } from '../../../domain/data-normalization/services/normalization.service';
import { DexieNormalizedListingRepository, IngestionMetricsEx } from '../../../infra/storage/dexie-normalized-listing.adapter';

const normalizer = new DataNormalizationService();
const repo = new DexieNormalizedListingRepository();

const BATCH_SIZE = 500;

export function useDataNormalization() {
  const [messages, setMessages] = useState<NormalizedListing[]>([]);
  const [metrics, setMetrics] = useState<IngestionMetricsEx | null>(null);
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [elevatorFilter, setElevatorFilter] = useState<boolean | undefined>(undefined);
  const [templateFilter, setTemplateFilter] = useState<TemplateFamily | 'all' | null>('all');
  const [partialFilter, setPartialFilter] = useState<boolean | undefined>(undefined);

  const loadStoredMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await repo.findAll({
      searchQuery: searchQuery || undefined,
      district: districtFilter || undefined,
      hasElevator: elevatorFilter,
      templateFamily: templateFilter,
      isPartiallyParsed: partialFilter,
    });

    if (result.isOk) {
      setMessages(result.value);
    } else {
      setError(result.error.message);
    }

    const sessionRes = await repo.getLatestSession();
    if (sessionRes.isOk) {
      setImportSession(sessionRes.value);
    }

    setLoading(false);
  }, [searchQuery, districtFilter, elevatorFilter, templateFilter, partialFilter]);

  useEffect(() => {
    loadStoredMessages();
  }, [loadStoredMessages]);

  const importJsonFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const text = await file.text();
      const jsonData: RawJsonInputFile = JSON.parse(text);

      if (!jsonData || !Array.isArray(jsonData.messages)) {
        throw new Error('Cấu trúc file JSON không hợp lệ! File cần chứa mảng "messages".');
      }

      const rawMessages = jsonData.messages;
      const totalMessages = rawMessages.length;
      const totalBatches = Math.ceil(totalMessages / BATCH_SIZE);

      const seenHashes = new Set<string>();
      const uniqueListings: NormalizedListing[] = [];
      let dupesInFile = 0;

      for (let b = 0; b < totalBatches; b++) {
        const batch = rawMessages.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        for (const rawMsg of batch) {
          const listing = normalizer.normalizeListing(rawMsg);
          if (seenHashes.has(listing.contentHash)) {
            dupesInFile++;
          } else {
            seenHashes.add(listing.contentHash);
            uniqueListings.push(listing);
          }
        }

        // yield to event loop for React UI render / progress bar update
        await new Promise((r) => setTimeout(r, 0));
        const currentProgress = Math.round(((b + 1) / totalBatches) * 100);
        setProgress(currentProgress);
      }

      // Save batch to IndexedDB with 2nd stage DB deduplication
      const saveResult = await repo.saveBatch(uniqueListings, dupesInFile, {
        fileName: file.name,
        totalMessages,
      });

      if (saveResult.isOk) {
        setMetrics(saveResult.value.metrics);
        setImportSession(saveResult.value.session);
        await loadStoredMessages();
      } else {
        setError(saveResult.error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định khi nạp file JSON');
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const clearStorage = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu chuẩn hóa trong IndexedDB?')) {
      setLoading(true);
      await repo.clearAll();
      setMetrics(null);
      setImportSession(null);
      setProgress(0);
      await loadStoredMessages();
      setLoading(false);
    }
  };

  return {
    messages,
    metrics,
    importSession,
    progress,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    elevatorFilter,
    setElevatorFilter,
    templateFilter,
    setTemplateFilter,
    partialFilter,
    setPartialFilter,
    importJsonFile,
    clearStorage,
    refresh: loadStoredMessages,
  };
}
