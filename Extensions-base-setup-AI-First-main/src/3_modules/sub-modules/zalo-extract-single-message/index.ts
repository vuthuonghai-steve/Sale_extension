/**
 * Sub-module thuần: trích xuất 1 tin nhắn đơn Zalo Web (Architect §4 — Layer 3 Pure TS).
 * Không import chrome/document/window (G1-06). Trích xuất raw text từ target message element
 * giữ nguyên \n và Emoji Unicode. Trả về Stage Result JSON envelope ('EXTRACTED').
 */

import { AppErrorCode } from '../../../0_contracts/ipc-payloads';
import type {
  IZaloDOMAdapter,
  IZaloMessageExtractInput,
  IZaloMessageExtractOutput,
} from '../../../0_contracts/zalo-extract.contract';

/**
 * Interface chung cho các sub-modules có khả năng đóng gói Pipeline Stage Envelope
 */
export interface IStageProcessor<TInput, TOutput> {
  process(input: TInput): Promise<TOutput>;
}

/**
 * Layer 3 — Core Sub-Module: zalo-extract-single-message
 * Trách nhiệm duy nhất: Tiếp nhận Target Message Element -> Trích xuất văn bản tin nhắn
 * đầy đủ định dạng (\n, Emoji) -> Đóng gói Standard Stage JSON Output Envelope.
 */
export class ZaloExtractSingleMessageModule
  implements IStageProcessor<IZaloMessageExtractInput, IZaloMessageExtractOutput>
{
  constructor(private domAdapter: IZaloDOMAdapter) {}

  /**
   * Trích xuất 1 tin nhắn đơn thành công và xuất Stage Result JSON
   */
  public async process(input: IZaloMessageExtractInput): Promise<IZaloMessageExtractOutput> {
    const timestamp = Date.now();
    const traceId = input.traceId;

    try {
      if (!input.targetElement) {
        return {
          stage: 'EXTRACTED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-web-dom-adapter',
            textLength: 0,
            hasEmoji: false,
            hasNewline: false,
          },
          error: {
            code: AppErrorCode.INVALID_PAYLOAD,
            message: 'TargetElement is missing in IZaloMessageExtractInput',
          },
        };
      }

      // 1. Gọi Adapter lấy raw data từ DOM element qua interface
      const rawResult = this.domAdapter.extractMessageFromElement(input.targetElement);

      if (!rawResult) {
        return {
          stage: 'EXTRACTED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-web-dom-adapter',
            textLength: 0,
            hasEmoji: false,
            hasNewline: false,
          },
          error: {
            code: AppErrorCode.NOT_FOUND,
            message: 'Failed to extract text from target message element',
          },
        };
      }

      const extractedText = rawResult.extractedText;
      const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(extractedText);
      const hasNewline = extractedText.includes('\n');

      // 2. Trả về Output Envelope JSON chuẩn
      return {
        stage: 'EXTRACTED',
        success: true,
        timestamp,
        traceId,
        data: {
          messageId: rawResult.messageId ?? input.messageId ?? null,
          extractedText,
        },
        metadata: {
          source: 'zalo-web-dom-adapter',
          containerClass: rawResult.containerClass,
          textLength: extractedText.length,
          hasEmoji,
          hasNewline,
        },
        error: null,
      };
    } catch (err) {
      return {
        stage: 'EXTRACTED',
        success: false,
        timestamp,
        traceId,
        data: null,
        metadata: {
          source: 'zalo-web-dom-adapter',
          textLength: 0,
          hasEmoji: false,
          hasNewline: false,
        },
        error: {
          code: AppErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown extraction error',
          detail: err,
        },
      };
    }
  }
}

/**
 * Helper pure function tiện ích trích xuất trực tiếp khi đã có sẵn adapter
 */
export function extractSingleMessage(
  adapter: IZaloDOMAdapter,
  input: IZaloMessageExtractInput
): Promise<IZaloMessageExtractOutput> {
  const module = new ZaloExtractSingleMessageModule(adapter);
  return module.process(input);
}
