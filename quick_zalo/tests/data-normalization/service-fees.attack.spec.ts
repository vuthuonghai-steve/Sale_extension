import { describe, it, expect } from 'vitest';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';

describe('DataNormalizationService — Service Fees & Policies Attack (BS-SF-01, BS-SF-02, BS-SF-03)', () => {
  const normalizer = new DataNormalizationService();

  describe('1. Legacy parseServices & Management Regex (BS-SF-01)', () => {
    it('should extract service pricing from standard TNR service line', () => {
      const text = `✅ Dịch vụ: Điện 3.8k/số, nước 100k/người, internet 100k/phòng, máy giặt 50k`;
      const listing = normalizer.normalizeListing({ id: 'msg_f1', data_raw: text });

      expect(listing.services.electricity).toBe('3.8k/số');
      expect(listing.services.water).toBe('100k/người');
      expect(listing.services.washingMachine).toBe('50k');
      expect(listing.services.management).toBeDefined();
    });
  });

  describe('2. Detailed Service Fees Breakdown (BS-SF-02 & BS-SF-03)', () => {
    it('should parse electricity, water, internet, and management numeric values correctly', () => {
      const text = `☘️ Phí dv:\nĐiện 4k/số\nNước 100k/người\nInternet 100k/phòng\nDịch vụ chung 150k/người\nGửi xe 100k/xe`;
      const listing = normalizer.normalizeListing({ id: 'msg_f2', data_raw: text });

      expect(listing.serviceFees.electricity).toBe(4000);
      expect(listing.serviceFees.water).toBe(100000);
      expect(listing.serviceFees.internet).toBe(100000);
      expect(listing.serviceFees.management).toBe(150000);
      expect(listing.serviceFees.parking).toBe(100000);
    });

    it('should parse 95 Home fee header format "⚡ Chi phí dịch vụ"', () => {
      const text = `⚡ Chi phí dịch vụ: Điện 3.8k, Nước 100k, Mạng 100k, Phí quản lý 150k`;
      const listing = normalizer.normalizeListing({ id: 'msg_f3', data_raw: text });

      expect(listing.serviceFees.electricity).toBe(3800);
      expect(listing.serviceFees.water).toBe(100000);
      expect(listing.serviceFees.internet).toBe(100000);
      expect(listing.serviceFees.management).toBe(150000);
    });

    it('should return null fees when no matching fee line is present', () => {
      const text = `Mã A101\n🏠 Địa chỉ: Thanh Xuân\n💰 Giá: 4tr`;
      const listing = normalizer.normalizeListing({ id: 'msg_f4', data_raw: text });

      expect(listing.serviceFees.electricity).toBeNull();
      expect(listing.serviceFees.water).toBeNull();
      expect(listing.serviceFees.internet).toBeNull();
      expect(listing.serviceFees.management).toBeNull();
    });
  });

  describe('3. Policies and Availability Date', () => {
    it('should parse Pet, Foreigner, and Vehicle policies correctly', () => {
      const text = `🏠 Địa chỉ: Cầu Giấy\nCho nuôi chó mèo\nNhận khách nước ngoài\nCó bãi gửi ô tô`;
      const listing = normalizer.normalizeListing({ id: 'msg_f5', data_raw: text });

      const policyTypes = listing.policies.map((p) => p.type);
      expect(policyTypes).toContain('PET');
      expect(policyTypes).toContain('FOREIGNER');
      expect(policyTypes).toContain('VEHICLE');
    });

    it('should parse availability date "Ở ngay" or specific date "vào ở 15/8"', () => {
      const textImmediate = `Trống: Phòng 201 ở ngay`;
      const textDate = `Phòng trống vào ở ngày 15/08`;

      expect(normalizer.normalizeListing({ id: 'msg_f6', data_raw: textImmediate }).availabilityDate).toBe('Ở ngay');
      expect(normalizer.normalizeListing({ id: 'msg_f7', data_raw: textDate }).availabilityDate).toBe('15/08');
    });
  });
});
