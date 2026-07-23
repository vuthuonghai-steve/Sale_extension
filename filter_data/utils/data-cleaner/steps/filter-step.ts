import { BaseCleaningStep } from './base-step';
import type { CleanListingRecord, CleaningOptions } from '../types';

/**
 * FilterStep
 * Lọc loại bỏ các bản ghi không hợp lệ, tin báo hết phòng (FULL P), hoặc tin rác.
 */
export class FilterStep extends BaseCleaningStep<CleanListingRecord[], CleanListingRecord[]> {
  public readonly name = 'FilterStep';

  public execute(input: CleanListingRecord[], _options?: CleaningOptions): CleanListingRecord[] {
    if (!this.enabled) return input;

    return input.filter((record) => {
      // 1. Loại bỏ tin báo FULL P / Hết phòng
      if (record.isFull) {
        return false;
      }

      const raw = (record.rawRef || '').trim();

      // 2. Loại bỏ các dòng status nhắn tin hết phòng đơn lẻ
      if (/FULL P\b|FULL ❌/i.test(raw)) {
        return false;
      }

      // 3. Loại bỏ mảnh text rác ngắn không có địa chỉ lẫn giá
      if (raw.length < 30 && !record.priceVnd && !record.address) {
        return false;
      }

      // 4. Bắt buộc có giá thuê hợp lệ (từ 500,000 VND trở lên) hoặc có địa chỉ rõ ràng
      if (record.priceVnd && record.priceVnd < 500000) {
        return false;
      }

      if (!record.priceVnd && !record.address) {
        return false;
      }

      return true;
    });
  }
}
