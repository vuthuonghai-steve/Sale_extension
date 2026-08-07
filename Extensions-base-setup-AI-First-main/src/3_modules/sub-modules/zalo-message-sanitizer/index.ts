/**
 * Sub-module thuần: Lọc và chuẩn hóa 1 tin nhắn Zalo Web (Architect §4 — Layer 3 Pure TS).
 * Không import chrome/document/window (G1-06). Loại bỏ nhãn thương hiệu, hoa hồng môi giới,
 * header quote cũ và emoji mồ côi. Đóng gói trả về Stage Result JSON envelope ('SANITIZED').
 */

import { AppErrorCode } from '../../../0_contracts/ipc-payloads';
import type {
  IZaloMessageSanitizeInput,
  IZaloMessageSanitizeOutput,
} from '../../../0_contracts/zalo-sanitizer.contract';
import { FilterRules } from './filter-rules';

/**
 * Interface chung cho các sub-modules có khả năng đóng gói Pipeline Stage Envelope
 */
export interface IStageProcessor<TInput, TOutput> {
  process(input: TInput): Promise<TOutput>;
}

/**
 * Layer 3 — Core Sub-Module: zalo-message-sanitizer
 * Trách nhiệm duy nhất: Tiếp nhận rawText -> Làm sạch thông tin nhạy cảm / rác -> Đóng gói Standard Stage JSON Output Envelope.
 */
export class ZaloMessageSanitizerModule
  implements IStageProcessor<IZaloMessageSanitizeInput, IZaloMessageSanitizeOutput>
{
  // eslint-disable-next-line @typescript-eslint/require-await
  public async process(input: IZaloMessageSanitizeInput): Promise<IZaloMessageSanitizeOutput> {
    const timestamp = Date.now();
    const traceId = input.traceId;

    try {
      if (!input.rawText && input.rawText !== '') {
        return {
          stage: 'SANITIZED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-message-sanitizer',
            rawLength: 0,
            sanitizedLength: 0,
            removedCommission: false,
            removedBranding: false,
            hasEmoji: false,
          },
          error: {
            code: AppErrorCode.INVALID_PAYLOAD,
            message: 'Raw text is missing or null in IZaloMessageSanitizeInput',
          },
        };
      }

      const rawText = input.rawText;
      const rawLength = rawText.length;

      const filterBranding = input.options?.filterBranding ?? true;
      const filterCommission = input.options?.filterCommission ?? true;

      let result = rawText;

      // Step 1: Normalize newlines (\r\n -> \n)
      result = result.replace(/\r\n/g, '\n');

      // Step 2: Strip Reply Quote Headers
      result = result.replace(FilterRules.REPLY_QUOTE_REGEX, '');

      let removedCommission = false;
      let removedBranding = false;

      // Step 3: Filter independent lines (Commission lines, source tags)
      result = result
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => {
          const trimmed = line.trim();
          if (!trimmed) return true;

          if (filterCommission) {
            // Bỏ dòng hoa hồng phần trăm trần
            if (FilterRules.COMMISSION_LINE_PERCENT_REGEX.test(trimmed)) {
              removedCommission = true;
              return false;
            }
            // Bỏ dòng hoa hồng tiền mặt trần
            if (FilterRules.COMMISSION_LINE_MONEY_REGEX.test(trimmed)) {
              removedCommission = true;
              return false;
            }
          }

          if (filterBranding) {
            // Bỏ dòng dẫn nguồn rỗng
            if (
              /^[•\-–—]?[ \t]*Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*:?$/i.test(
                trimmed
              )
            ) {
              removedBranding = true;
              return false;
            }
          }

          return true;
        })
        .join('\n');

      // Step 4: Strip Commission Info dính trước Mã
      if (filterCommission) {
        const commRegex = new RegExp(FilterRules.COMMISSION_REGEX.source, FilterRules.COMMISSION_REGEX.flags);
        const beforeComm = result;
        result = result.replace(commRegex, '');
        if (result !== beforeComm) removedCommission = true;
      }

      // Step 5: Strip Orphan Emojis
      const orphanRegex = new RegExp(FilterRules.ORPHAN_EMOJI_REGEX.source, FilterRules.ORPHAN_EMOJI_REGEX.flags);
      result = result.replace(orphanRegex, '');

      // Step 6: Strip Brand Tags
      if (filterBranding) {
        const brandRegex = new RegExp(FilterRules.BRAND_REGEX.source, FilterRules.BRAND_REGEX.flags);
        const beforeBrand = result;
        result = result.replace(brandRegex, '');
        if (result !== beforeBrand) removedBranding = true;
      }

      // Step 7: Strip Unicode replacement chars (\uFFFD, \uFEFF)
      result = result.replace(/[\uFFFD\uFEFF]/g, '');

      // Final normalize space & trim multi-newlines
      const sanitizedText = this.normalize(result);
      const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(sanitizedText);

      return {
        stage: 'SANITIZED',
        success: true,
        timestamp,
        traceId,
        data: {
          sanitizedText,
          originalText: rawText,
        },
        metadata: {
          source: 'zalo-message-sanitizer',
          rawLength,
          sanitizedLength: sanitizedText.length,
          removedCommission,
          removedBranding,
          hasEmoji,
        },
        error: null,
      };
    } catch (err) {
      return {
        stage: 'SANITIZED',
        success: false,
        timestamp,
        traceId,
        data: null,
        metadata: {
          source: 'zalo-message-sanitizer',
          rawLength: input.rawText?.length ?? 0,
          sanitizedLength: 0,
          removedCommission: false,
          removedBranding: false,
          hasEmoji: false,
        },
        error: {
          code: AppErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown sanitization error',
          detail: err,
        },
      };
    }
  }

  /**
   * Helper nén khoảng trắng thừa và chuẩn hóa dòng rỗng liên tiếp
   */
  private normalize(str: string): string {
    if (!str) return '';
    return str
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

/**
 * Helper pure function tiện ích lọc trực tiếp chuỗi văn bản Zalo
 */
export function sanitizeZaloMessage(
  input: IZaloMessageSanitizeInput
): Promise<IZaloMessageSanitizeOutput> {
  const module = new ZaloMessageSanitizerModule();
  return module.process(input);
}
