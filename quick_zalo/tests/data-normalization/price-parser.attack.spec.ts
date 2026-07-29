import { describe, it, expect } from 'vitest';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';

describe('DataNormalizationService — Price Parsing Attack (BS-PR-01 & BS-PR-02)', () => {
  const normalizer = new DataNormalizationService();

  describe('1. Price Format Variants (BS-PR-01)', () => {
    it('should parse "4tr7" into 4,700,000', () => {
      const text = `💰 Giá: 4tr7`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_700_000);
    });

    it('should parse "4.5tr" into 4,500,000', () => {
      const text = `Giá: 4.5tr`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_500_000);
    });

    it('should parse "4.500.000" into 4,500,000', () => {
      const text = `Giá: 4.500.000`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_500_000);
    });

    it('should parse "4tr" into 4,000,000', () => {
      const text = `Giá: 4tr`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_000_000);
    });

    it('should parse "4tr50" into 4,500,000', () => {
      const text = `Giá: 4tr50`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_500_000);
    });

    it('should parse price with trailing text "Giá: 4tr5 (còn TL)"', () => {
      const text = `Giá: 4tr5 (còn TL)`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_500_000);
    });

    it('should handle price ranges and extract numeric from range string "4tr - 4tr2"', () => {
      const text = `Giá: 4tr - 4tr2`;
      expect(normalizer.parsePriceNumeric(text)).toBe(4_000_000);
    });

    it('should return null or handle non-numeric prices like "thỏa thuận" or "liên hệ"', () => {
      expect(normalizer.parsePriceNumeric(`Giá: thỏa thuận`)).toBeNull();
      expect(normalizer.parsePriceNumeric(`Giá: Liên hệ`)).toBeNull();
    });
  });

  describe('2. Price Range Extraction (BS-PR-02)', () => {
    it('should parse structured price range "4tr5 - 5tr"', () => {
      const text = `Mã A101\nGiá: 4tr5 - 5tr\nĐịa chỉ: Cầu Giấy`;
      const listing = normalizer.normalizeListing({ id: 'msg_1', data_raw: text });

      expect(listing.priceRange).toEqual({
        from: 4_500_000,
        to: 5_000_000,
      });
    });

    it('should parse tight range string "4tr5-5tr" without spaces', () => {
      const text = `Giá: 4tr5-5tr`;
      const listing = normalizer.normalizeListing({ id: 'msg_2', data_raw: text });

      expect(listing.priceRange).toEqual({
        from: 4_500_000,
        to: 5_000_000,
      });
    });

    it('should safely handle single price without returning priceRange', () => {
      const text = `Mã B202\nGiá: 5.5tr\nĐịa chỉ: Thanh Xuân`;
      const listing = normalizer.normalizeListing({ id: 'msg_3', data_raw: text });

      expect(listing.priceNumeric).toBe(5_500_000);
      expect(listing.priceRange).toBeNull();
    });
  });
});
