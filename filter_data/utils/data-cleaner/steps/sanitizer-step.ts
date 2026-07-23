import { BaseCleaningStep } from './base-step';
import type { RawRecord, CleaningOptions } from '../types';

/**
 * SanitizerStep
 * Làm sạch ký tự ẩn, mã điều khiển, chuẩn hóa xuống dòng và khoảng trắng rác trong từng bài đăng.
 */
export class SanitizerStep extends BaseCleaningStep<RawRecord[], RawRecord[]> {
  public readonly name = 'SanitizerStep';

  public execute(input: RawRecord[], _options?: CleaningOptions): RawRecord[] {
    if (!this.enabled) return input;

    return input.map((record) => {
      const rawText = String(record.rawText ?? '');
      
      // Xóa ký tự unicode ẩn zero-width space, BOM, control characters
      let sanitized = rawText.replace(/[\u200B-\u200D\uFEFF]/g, '');

      // Chuẩn hóa xuống dòng về \n và xóa khoảng trắng dư thừa ở cuối mỗi dòng
      sanitized = sanitized
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .join('\n');

      // Chuẩn hóa 3+ dòng trống liên tiếp thành 2 dòng trống
      sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

      return {
        ...record,
        rawText: sanitized,
      };
    });
  }
}
