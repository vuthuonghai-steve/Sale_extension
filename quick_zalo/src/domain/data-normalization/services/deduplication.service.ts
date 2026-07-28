import { NormalizedMessage, RawJsonInputMessage, IngestionMetrics } from '../entities/normalized-message.entity';
import { DataNormalizationService } from './normalization.service';

export interface Stage1DeduplicationResult {
  uniqueMessages: NormalizedMessage[];
  dupesInFile: number;
}

/**
 * Message Deduplication Service
 * Domain Service for Stage 1 (File Input Self-Deduplication) and 2-Stage coordination.
 */
export class MessageDeduplicationService {
  constructor(private readonly normalizationService: DataNormalizationService) {}

  /**
   * Stage 1: Filters out duplicate raw messages within the input JSON array.
   * Calculates contentHash for each message and maintains an in-memory set.
   */
  public deduplicateFileInput(rawMessages: RawJsonInputMessage[]): Stage1DeduplicationResult {
    const seenHashes = new Set<string>();
    const uniqueMessages: NormalizedMessage[] = [];
    let dupesInFile = 0;

    for (const rawMsg of rawMessages) {
      if (!rawMsg.data_raw || rawMsg.data_raw.trim() === '') {
        continue;
      }
      const normalized = this.normalizationService.normalize(rawMsg);

      if (seenHashes.has(normalized.contentHash)) {
        dupesInFile++;
      } else {
        seenHashes.add(normalized.contentHash);
        uniqueMessages.push(normalized);
      }
    }

    return {
      uniqueMessages,
      dupesInFile,
    };
  }
}
