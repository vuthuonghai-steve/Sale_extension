import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '../../../../src/0_contracts/ipc-payloads';
import {
  sanitizeZaloMessage,
  ZaloMessageSanitizerModule,
} from '../../../../src/3_modules/sub-modules/zalo-message-sanitizer';
import realWorldFixtures from './fixtures.json';

describe('ZaloMessageSanitizerModule', () => {
  const module = new ZaloMessageSanitizerModule();

  describe('Core Unit Rules', () => {
    it('trả về lỗi INVALID_PAYLOAD khi rawText bị thiếu hoặc undefined', async () => {
      const result = await module.process({
        traceId: 'tr-test-san-001',
        rawText: undefined as unknown as string,
      });

      expect(result.success).toBe(false);
      expect(result.stage).toBe('SANITIZED');
      expect(result.error?.code).toBe(AppErrorCode.INVALID_PAYLOAD);
      expect(result.data).toBeNull();
    });

    it('Case 1: Lọc hoa hồng phần trăm đa mốc dính trước Mã nhà', async () => {
      const rawInput = '🌷 40%- 12th | 30%- 6th Mã: 🏆 379';
      const result = await module.process({
        traceId: 'tr-test-san-002',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.stage).toBe('SANITIZED');
      expect(result.data?.sanitizedText).toBe('Mã: 🏆 379');
      expect(result.metadata.removedCommission).toBe(true);
    });

    it('Case 2: Lọc hoa hồng tiền mặt dính trước Mã nhà', async () => {
      const rawInput = '🌷1tr1 - 6-12m Mã: 🏆 626';
      const result = await module.process({
        traceId: 'tr-test-san-003',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Mã: 🏆 626');
      expect(result.metadata.removedCommission).toBe(true);
    });

    it('Case 3: Lọc ghi chú ngoặc đơn hoa hồng', async () => {
      const rawInput = '🌷40% - 12m ( Chủ dẫn 30% -12M) Mã: 🏆 232';
      const result = await module.process({
        traceId: 'tr-test-san-004',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Mã: 🏆 232');
      expect(result.metadata.removedCommission).toBe(true);
    });

    it('Case 4: Lọc emoji mồ côi đứng trước Mã', async () => {
      const rawInput = '🌷 Mã: 🏆 063';
      const result = await module.process({
        traceId: 'tr-test-san-005',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Mã: 🏆 063');
    });

    it('Case 5: Lọc nhãn thương hiệu nguồn hàng', async () => {
      const rawInput = '🏆TL21House🏆\nCăn hộ 2PN 15tr/tháng';
      const result = await module.process({
        traceId: 'tr-test-san-006',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Căn hộ 2PN 15tr/tháng');
      expect(result.metadata.removedBranding).toBe(true);
    });

    it('Case 6: Lọc dòng hoa hồng phần trăm độc lập', async () => {
      const rawInput =
        'Căn hộ 2PN2WC cao cấp:\n 35%-12th | 25%-6th ( Chủ dẫn)\nĐịa chỉ: Quận 1';
      const result = await module.process({
        traceId: 'tr-test-san-007',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe(
        'Căn hộ 2PN2WC cao cấp:\nĐịa chỉ: Quận 1'
      );
      expect(result.metadata.removedCommission).toBe(true);
    });

    it('Case 7: Bảo tồn nguyên vẹn dòng Giá phòng bđs (tránh xóa nhầm)', async () => {
      const rawInput = 'Giá 4tr8-301 phòng đẹp';
      const result = await module.process({
        traceId: 'tr-test-san-008',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Giá 4tr8-301 phòng đẹp');
      expect(result.metadata.removedCommission).toBe(false);
    });

    it('Case 8: Lọc ký tự Unicode rác (\\uFFFD, \\uFEFF) và bảo tồn 100% Emoji Surrogate Pairs 4-byte', async () => {
      const rawInput = 'Văn bản dính ký tự lỗi \uFFFD và BOM \uFEFF 🍾';
      const result = await module.process({
        traceId: 'tr-test-san-009',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe(
        'Văn bản dính ký tự lỗi và BOM 🍾'
      );
      expect(result.metadata.hasEmoji).toBe(true);
    });

    it('Helper sanitizeZaloMessage hoạt động tương tự class', async () => {
      const rawInput = '🏆TL21House🏆\nMã: 🏆 100';
      const result = await sanitizeZaloMessage({
        traceId: 'tr-test-san-010',
        rawText: rawInput,
      });

      expect(result.success).toBe(true);
      expect(result.data?.sanitizedText).toBe('Mã: 🏆 100');
    });
  });

  describe('Real-World Fixture Tests (Managed Data)', () => {
    it.each(realWorldFixtures)(
      '$id: $description',
      async ({
        id,
        rawInput,
        expectRemovedCommission,
        expectRemovedBranding,
        shouldContain,
        shouldNotContain,
      }) => {
        const result = await module.process({
          traceId: `tr-fixture-${id}`,
          rawText: rawInput,
        });

        expect(result.success).toBe(true);
        expect(result.metadata.removedCommission).toBe(expectRemovedCommission);
        expect(result.metadata.removedBranding).toBe(expectRemovedBranding);

        const sanitizedText = result.data?.sanitizedText ?? '';
        for (const substring of shouldContain) {
          expect(sanitizedText).toContain(substring);
        }
        for (const substring of shouldNotContain) {
          expect(sanitizedText).not.toContain(substring);
        }
      }
    );
  });
});
