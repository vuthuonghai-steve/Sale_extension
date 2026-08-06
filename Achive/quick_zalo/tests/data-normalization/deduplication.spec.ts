import { describe, it, expect } from 'vitest';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';
import { MessageDeduplicationService } from '@domain/data-normalization/services/deduplication.service';
import { RawJsonInputMessage } from '@domain/data-normalization/entities/normalized-message.entity';

describe('MessageDeduplicationService — Stage 1 Deduplication (BS-DD-01 & BS-DD-02)', () => {
  const normalizer = new DataNormalizationService();
  const dedupService = new MessageDeduplicationService(normalizer);

  describe('1. Basic Deduplication Logic', () => {
    it('should correctly separate unique messages from duplicates in a file', () => {
      const msg1: RawJsonInputMessage = {
        id: '1',
        data_raw: 'Mã A101\n🏠 Địa chỉ: Thanh Xuân\n💰 Giá: 4tr',
      };
      const msg2: RawJsonInputMessage = {
        id: '2',
        data_raw: 'Mã A101\n🏠 Địa chỉ: Thanh Xuân\n💰 Giá: 4tr  ', // Extra trailing space
      };
      const msg3: RawJsonInputMessage = {
        id: '3',
        data_raw: 'Mã B202\n🏠 Địa chỉ: Cầu Giấy\n💰 Giá: 5tr',
      };

      const result = dedupService.deduplicateFileInput([msg1, msg2, msg3]);

      expect(result.uniqueMessages).toHaveLength(2);
      expect(result.dupesInFile).toBe(1);
      expect(result.uniqueMessages[0].code).toBe('A101');
      expect(result.uniqueMessages[1].code).toBe('B202');
    });

    it('should handle zero duplicates when all input messages are unique', () => {
      const inputs: RawJsonInputMessage[] = [
        { id: '1', data_raw: 'Mã A1' },
        { id: '2', data_raw: 'Mã A2' },
        { id: '3', data_raw: 'Mã A3' },
      ];

      const result = dedupService.deduplicateFileInput(inputs);
      expect(result.uniqueMessages).toHaveLength(3);
      expect(result.dupesInFile).toBe(0);
    });

    it('should count N-1 dupes when all N input messages have identical content', () => {
      const msg: RawJsonInputMessage = { id: 'x', data_raw: 'Mã DUP_100\nGiá 5tr' };
      const inputs = [msg, msg, msg, msg];

      const result = dedupService.deduplicateFileInput(inputs);
      expect(result.uniqueMessages).toHaveLength(1);
      expect(result.dupesInFile).toBe(3);
    });
  });

  describe('2. Empty and Whitespace Handling (BS-DD-02)', () => {
    it('should skip messages with empty or whitespace-only data_raw', () => {
      const inputs: RawJsonInputMessage[] = [
        { id: '1', data_raw: '' },
        { id: '2', data_raw: '   \n\t  ' },
        { id: '3', data_raw: 'Mã Valid\nGiá 4tr' },
      ];

      const result = dedupService.deduplicateFileInput(inputs);
      expect(result.uniqueMessages).toHaveLength(1);
      expect(result.dupesInFile).toBe(0);
    });

    it('should return empty result when given empty input array', () => {
      const result = dedupService.deduplicateFileInput([]);
      expect(result.uniqueMessages).toHaveLength(0);
      expect(result.dupesInFile).toBe(0);
    });
  });

  describe('3. ContentHash Hash Generation Stability (BS-DD-01)', () => {
    it('should generate identical hash regardless of case and space collapsing', () => {
      const text1 = 'Mã   A101\nGiá  4tr';
      const text2 = 'mã a101\ngiá 4tr';

      const hash1 = normalizer.generateContentHash(text1);
      const hash2 = normalizer.generateContentHash(text2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^hash_[0-9a-f]+_\d+$/);
    });
  });
});
