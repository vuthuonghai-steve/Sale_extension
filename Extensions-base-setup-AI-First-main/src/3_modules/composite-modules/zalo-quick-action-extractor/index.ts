/**
 * Composite Module Core: Modul Chính zalo-quick-action-extractor (Layer 3 Pure TS).
 * Tuân thủ G1-06: 100% Pure TypeScript (KHÔNG import chrome, window, document).
 * Hợp nhất bộ 3 sub-modules (locator, extractor, sanitizer) & Platform Clipboard Adapter.
 * Đóng gói Stage Output Envelope 'COPIED' kèm traceId xuyên suốt.
 */

import { AppErrorCode } from '../../../0_contracts/ipc-payloads';
import type {
  IClipboardAdapter,
  IZaloQuickActionInput,
  IZaloQuickActionOutput,
  IZaloQuickActionResult,
} from '../../../0_contracts/zalo-quick-action.contract';
import type { IZaloSelectionLocatorResult } from '../../../0_contracts/zalo-selection.contract';
import { ZaloExtractSingleMessageModule } from '../../sub-modules/zalo-extract-single-message';
import { ZaloMessageSanitizerModule } from '../../sub-modules/zalo-message-sanitizer';
import { ZaloSelectionLocatorModule } from '../../sub-modules/zalo-selection-locator';

export interface IStageProcessor<TInput, TOutput> {
  process(input: TInput): Promise<TOutput>;
}

/**
 * Layer 3 — Composite Orchestrator Module: zalo-quick-action-extractor
 */
export class ZaloQuickActionExtractorModule
  implements IStageProcessor<IZaloQuickActionInput, IZaloQuickActionOutput>
{
  constructor(
    private selectionLocator: ZaloSelectionLocatorModule,
    private singleExtractor: ZaloExtractSingleMessageModule,
    private sanitizer: ZaloMessageSanitizerModule,
    private clipboardAdapter: IClipboardAdapter
  ) {}

  public async process(input: IZaloQuickActionInput): Promise<IZaloQuickActionOutput> {
    const startTime = Date.now();
    const timestamp = input.timestamp ?? startTime;
    const traceId = input.traceId;

    try {
      // 0. Validate traceId
      if (!traceId) {
        return {
          stage: 'COPIED',
          success: false,
          timestamp,
          traceId: '',
          data: null,
          metadata: {
            source: 'zalo-quick-action-extractor',
            rawLength: 0,
            sanitizedLength: 0,
            hasEmoji: false,
            removedCommission: false,
            removedBranding: false,
            executionTimeMs: 0,
            userGestureType: 'FALLBACK',
          },
          error: {
            code: AppErrorCode.INVALID_PAYLOAD,
            message: 'traceId is required for ZaloQuickActionExtractorModule',
          },
        };
      }

      let locatedData: IZaloSelectionLocatorResult | null = null;

      // STAGE 1: LOCATED (nếu chưa truyền sẵn targetElement thì gọi selectionLocator để định vị và leo DOM)
      if (!input.targetElement) {
        const locatedStage = await this.selectionLocator.process({
          traceId,
          timestamp,
        });

        if (!locatedStage.success || !locatedStage.data) {
          return {
            stage: 'COPIED',
            success: false,
            timestamp,
            traceId,
            data: null,
            metadata: {
              source: 'zalo-quick-action-extractor',
              rawLength: 0,
              sanitizedLength: 0,
              hasEmoji: false,
              removedCommission: false,
              removedBranding: false,
              executionTimeMs: Date.now() - startTime,
              userGestureType: 'FALLBACK',
            },
            error: locatedStage.error ?? {
              code: AppErrorCode.UNKNOWN_ERROR,
              message: 'Failed at Stage 1: LOCATED',
            },
          };
        }

        locatedData = locatedStage.data;

        // Bẫy 1: Bôi đen nằm trong ô gõ tin nhắn (#input_chat)
        if (locatedData.metadata.isInputArea) {
          return {
            stage: 'COPIED',
            success: false,
            timestamp,
            traceId,
            data: null,
            metadata: {
              source: 'zalo-quick-action-extractor',
              rawLength: 0,
              sanitizedLength: 0,
              hasEmoji: false,
              removedCommission: false,
              removedBranding: false,
              executionTimeMs: Date.now() - startTime,
              userGestureType: 'FALLBACK',
            },
            error: {
              code: AppErrorCode.INVALID_PAYLOAD,
              message: 'SELECTION_INSIDE_INPUT_AREA',
            },
          };
        }

        // Bẫy 2: Selection không hợp lệ và không tìm thấy targetElement hay selectedText
        if (!locatedData.isValidSelection && !locatedData.targetElement && !input.selectedText) {
          return {
            stage: 'COPIED',
            success: false,
            timestamp,
            traceId,
            data: null,
            metadata: {
              source: 'zalo-quick-action-extractor',
              rawLength: 0,
              sanitizedLength: 0,
              hasEmoji: false,
              removedCommission: false,
              removedBranding: false,
              executionTimeMs: Date.now() - startTime,
              userGestureType: 'FALLBACK',
            },
            error: {
              code: AppErrorCode.NOT_FOUND,
              message: 'INVALID_SELECTION',
            },
          };
        }
      }

      // STAGE 2: EXTRACTED
      let rawText = '';
      let messageId: string | null = locatedData?.messageId ?? null;
      const targetElem = input.targetElement ?? locatedData?.targetElement ?? null;
      const extractOnlySelection = Boolean(input.filterOptions?.extractOnlySelection);

      if (extractOnlySelection) {
        // Luồng tùy chọn: Chỉ lấy đoạn bôi đen nếu người dùng yêu cầu rõ ràng
        rawText = input.selectedText ?? locatedData?.selectedText ?? '';
      } else if (targetElem) {
        // Luồng cốt lõi thực tế: Bôi đen -> Leo DOM xác định toàn bộ text, icon ... của tin nhắn
        const extractStage = await this.singleExtractor.process({
          traceId,
          targetElement: targetElem,
          messageId: messageId ?? undefined,
        });

        if (!extractStage.success || !extractStage.data) {
          return {
            stage: 'COPIED',
            success: false,
            timestamp,
            traceId,
            data: null,
            metadata: {
              source: 'zalo-quick-action-extractor',
              rawLength: 0,
              sanitizedLength: 0,
              hasEmoji: false,
              removedCommission: false,
              removedBranding: false,
              executionTimeMs: Date.now() - startTime,
              userGestureType: 'FALLBACK',
            },
            error: extractStage.error ?? {
              code: AppErrorCode.UNKNOWN_ERROR,
              message: 'Failed at Stage 2: EXTRACTED',
            },
          };
        }

        rawText = extractStage.data.extractedText;
        messageId = extractStage.data.messageId ?? messageId;
      } else if (input.selectedText || locatedData?.selectedText) {
        // Fallback dự phòng nếu không tìm thấy targetElement trên DOM
        rawText = input.selectedText ?? locatedData?.selectedText ?? '';
      } else {
        return {
          stage: 'COPIED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-quick-action-extractor',
            rawLength: 0,
            sanitizedLength: 0,
            hasEmoji: false,
            removedCommission: false,
            removedBranding: false,
            executionTimeMs: Date.now() - startTime,
            userGestureType: 'FALLBACK',
          },
          error: {
            code: AppErrorCode.NOT_FOUND,
            message: 'NO_TARGET_ELEMENT_FOUND',
          },
        };
      }

      // Bẫy tin nhắn rỗng (Empty Extraction Guard)
      if (!rawText || rawText.trim().length === 0) {
        return {
          stage: 'COPIED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-quick-action-extractor',
            rawLength: 0,
            sanitizedLength: 0,
            hasEmoji: false,
            removedCommission: false,
            removedBranding: false,
            executionTimeMs: Date.now() - startTime,
            userGestureType: 'FALLBACK',
          },
          error: {
            code: AppErrorCode.INVALID_PAYLOAD,
            message: 'EMPTY_EXTRACTED_TEXT',
          },
        };
      }

      // STAGE 3: SANITIZED
      const sanitizeStage = await this.sanitizer.process({
        traceId,
        rawText,
        options: input.filterOptions,
      });

      if (!sanitizeStage.success || !sanitizeStage.data) {
        return {
          stage: 'COPIED',
          success: false,
          timestamp,
          traceId,
          data: null,
          metadata: {
            source: 'zalo-quick-action-extractor',
            rawLength: rawText.length,
            sanitizedLength: 0,
            hasEmoji: false,
            removedCommission: false,
            removedBranding: false,
            executionTimeMs: Date.now() - startTime,
            userGestureType: 'FALLBACK',
          },
          error: sanitizeStage.error ?? {
            code: AppErrorCode.UNKNOWN_ERROR,
            message: 'Failed at Stage 3: SANITIZED',
          },
        };
      }

      const sanitizedText = sanitizeStage.data.sanitizedText;

      // STAGE 4: COPIED
      const copiedSuccess = await this.clipboardAdapter.writeText(sanitizedText);

      // Phân loại User Gesture Type
      let userGestureType: 'KEYBOARD_GESTURE' | 'CLICK_GESTURE' | 'FALLBACK' = 'FALLBACK';
      if (input.triggerSource.startsWith('SHORTCUT')) {
        userGestureType = 'KEYBOARD_GESTURE';
      } else if (input.triggerSource === 'FLOATING_BAR_CLICK') {
        userGestureType = 'CLICK_GESTURE';
      }

      const executionTimeMs = Date.now() - startTime;
      const isPartialSelection = extractOnlySelection;

      const result: IZaloQuickActionResult = {
        traceId,
        isSuccess: copiedSuccess,
        triggerSource: input.triggerSource,
        isPartialSelection,
        messageId,
        sanitizedText,
        originalText: rawText,
        copiedToClipboard: copiedSuccess,
        boundingClientRect: locatedData?.boundingClientRect ?? null,
        metadata: {
          source: 'zalo-quick-action-extractor',
          rawLength: rawText.length,
          sanitizedLength: sanitizedText.length,
          hasEmoji: sanitizeStage.metadata.hasEmoji,
          removedCommission: sanitizeStage.metadata.removedCommission,
          removedBranding: sanitizeStage.metadata.removedBranding,
          executionTimeMs,
          userGestureType,
        },
      };

      return {
        stage: 'COPIED',
        success: copiedSuccess,
        timestamp,
        traceId,
        data: result,
        metadata: result.metadata,
        error: copiedSuccess
          ? null
          : {
              code: AppErrorCode.UNKNOWN_ERROR,
              message: 'Failed to write text to clipboard',
            },
      };
    } catch (err) {
      return {
        stage: 'COPIED',
        success: false,
        timestamp,
        traceId,
        data: null,
        metadata: {
          source: 'zalo-quick-action-extractor',
          rawLength: 0,
          sanitizedLength: 0,
          hasEmoji: false,
          removedCommission: false,
          removedBranding: false,
          executionTimeMs: Date.now() - startTime,
          userGestureType: 'FALLBACK',
        },
        error: {
          code: AppErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown composite orchestrator error',
          detail: err,
        },
      };
    }
  }
}
