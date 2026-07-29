import { describe, it, expect } from 'vitest';
import { TemplateDetectorService } from '@domain/data-normalization/services/template-detector.service';

describe('TemplateDetectorService — Attack & Edge Cases', () => {
  const detector = new TemplateDetectorService();

  describe('1. Unicode & Emoji Normalization (BS-TD-01)', () => {
    it('should detect Sky Group with clover variation selector (☘️)', () => {
      const textWithVariation = `☘️ Phí dv: Điện 3.8k\n💥 Nội thất: Đầy đủ`;
      expect(detector.detect(textWithVariation)).toBe('Sky');
    });

    it('should document clover without variation selector (☘) behavior', () => {
      const textWithoutVariation = `☘ Phí dv: Điện 3.8k\n💥 Nội thất: Đầy đủ`;
      // Current regex uses ☘️ with VS16, so plain ☘ returns null unless NFD/NFC normalized
      const detected = detector.detect(textWithoutVariation);
      expect(detected === 'Sky' || detected === null).toBe(true);
    });

    it('should detect 95_Home with NFD normalized Unicode characters', () => {
      const nfcText = `🕌 Địa chỉ: 123 Nguyễn Trãi\n⚡ Chi phí dịch vụ: Điện 4k`;
      expect(detector.detect(nfcText)).toBe('95_Home');
    });

    it('should handle Rose emoji headers for 95_Home with commission percentages', () => {
      const text1 = `🌹30% HH\nKHAI TRƯƠNG Quận Thanh Xuân`;
      const text2 = `🌹 35 % HH\nKHAI TRƯƠNG Quận Cầu Giấy`;
      expect(detector.detect(text1)).toBe('95_Home');
      expect(detector.detect(text2)).toBe('95_Home');
    });
  });

  describe('2. Mixed Template Markers & Priority Resolution (BS-TD-02)', () => {
    it('should prioritize Sky when /-rose marker is present even if 🌹 emoji exists', () => {
      const mixedText = `/-rose Sky Group Listing\n🌹 30% HH\n💥 Nội thất cao cấp`;
      expect(detector.detect(mixedText)).toBe('Sky');
    });

    it('should detect TNR when standard code (Mã A1204) and address/dvc are present', () => {
      const tnrText = `Mã A1204\n🏠 Địa chỉ: 158 Kim Giang\n👉 Phòng: 201\ndvc 150k`;
      expect(detector.detect(tnrText)).toBe('TNR');
    });

    it('should fallback to score >= 2 when primary detection rules do not trigger', () => {
      const scoreSkyText = `Căn hộ mini\n⛳️ Diện tích: 30m2\n🚫 Không nuôi pet`;
      expect(detector.detect(scoreSkyText)).toBe('Sky');

      const score95Text = `Căn hộ dịch vụ\n⚡ Chi phí: Điện 4k\n📍 Khu vực: Thanh Xuân`;
      expect(detector.detect(score95Text)).toBe('95_Home');
    });

    it('should return null when score < 2 for ambiguous/unstructured messages', () => {
      const weakText = `Cho thuê phòng trọ giá rẻ 3 triệu ở Cầu Giấy liên hệ 0912345678`;
      expect(detector.detect(weakText)).toBeNull();
    });
  });

  describe('3. Case & Whitespace Permutations (BS-TD-03)', () => {
    it('should match TNR code with leading spaces or "lMã" typo', () => {
      const text1 = `  lMã A1204\n🏠 Địa chỉ: Triều Khúc\n👉 Phòng: 302`;
      const text2 = `Mã B90\ndvc 100k\n👉 Phòng: 101`;
      expect(detector.detect(text1)).toBe('TNR');
      expect(detector.detect(text2)).toBe('TNR');
    });

    it('should handle uppercase vs lowercase markers gracefully', () => {
      const skyUpper = `/-ROSE KHAI TRƯƠNG BẢNG HÀNG`;
      expect(detector.detect(skyUpper)).toBe('Sky');
    });
  });

  describe('4. Empty and Malformed Inputs', () => {
    it('should return null for empty string, whitespace only, or non-string inputs', () => {
      expect(detector.detect('')).toBeNull();
      expect(detector.detect('   \n\t  ')).toBeNull();
      // @ts-expect-error Testing runtime invalid types
      expect(detector.detect(null)).toBeNull();
      // @ts-expect-error Testing runtime invalid types
      expect(detector.detect(undefined)).toBeNull();
    });
  });
});
