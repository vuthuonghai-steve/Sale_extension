/**
 * Sub-module thuần: Định vị & Kích hoạt sự kiện trích xuất tin nhắn Zalo Web (Layer 3 Pure TS).
 * Tuân thủ G1-06 (không import chrome/window/document).
 * Tiếp nhận thông tin Selection từ Adapter -> Xác minh vị trí, bẫy vùng cấm -> Trả về JSON envelope ('LOCATED').
 */

import { AppErrorCode } from '../../../0_contracts/ipc-payloads';
import type {
  IZaloSelectionDOMAdapter,
  IZaloSelectionLocatorInput,
  IZaloSelectionLocatorOutput,
  IZaloSelectionLocatorResult,
} from '../../../0_contracts/zalo-selection.contract';

export interface IStageProcessor<TInput, TOutput> {
  process(input: TInput): Promise<TOutput>;
}

/**
 * Layer 3 — Core Sub-Module: zalo-selection-locator
 * Trách nhiệm duy nhất: Tiếp nhận thông tin bôi đen văn bản từ DOM Adapter -> Validate quy tắc vị trí
 * -> Bẫy vùng nhập liệu / ngoài chat view -> Đóng gói Standard Stage Output Envelope.
 */
export class ZaloSelectionLocatorModule
  implements IStageProcessor<IZaloSelectionLocatorInput, IZaloSelectionLocatorOutput>
{
  constructor(private domAdapter: IZaloSelectionDOMAdapter) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  public async process(input: IZaloSelectionLocatorInput): Promise<IZaloSelectionLocatorOutput> {
    const timestamp = input.timestamp ?? Date.now();
    const traceId = input.traceId;

    try {
      if (!traceId) {
        return {
          stage: 'LOCATED',
          success: false,
          timestamp,
          traceId: '',
          data: null,
          metadata: {
            isWithinChatView: false,
            isInputArea: false,
          },
          error: {
            code: AppErrorCode.INVALID_PAYLOAD,
            message: 'traceId is required for ZaloSelectionLocatorModule',
          },
        };
      }

      // 1. Chụp dữ liệu Selection thô từ DOM Adapter
      const rawSelection = this.domAdapter.captureCurrentSelection();

      // 2. Nếu không có bôi đen hoặc văn bản rỗng sau khi trim -> Trả về result không hợp lệ
      if (!rawSelection || !rawSelection.selectedText.trim()) {
        const result: IZaloSelectionLocatorResult = {
          traceId,
          isValidSelection: false,
          targetElement: null,
          messageId: null,
          selectedText: rawSelection?.selectedText ?? '',
          boundingClientRect: rawSelection?.boundingClientRect ?? null,
          metadata: {
            isWithinChatView: false,
            isInputArea: false,
          },
        };

        return {
          stage: 'LOCATED',
          success: true,
          timestamp,
          traceId,
          data: result,
          metadata: result.metadata,
          error: null,
        };
      }

      const anchorElement = rawSelection.commonAncestorElement;

      // 3. Bẫy vùng cấm: Bôi đen trong ô soạn thảo (#input_chat, contenteditable...)
      const isInputArea = this.domAdapter.isInputArea(anchorElement);
      if (isInputArea) {
        const result: IZaloSelectionLocatorResult = {
          traceId,
          isValidSelection: false,
          targetElement: null,
          messageId: null,
          selectedText: rawSelection.selectedText,
          boundingClientRect: rawSelection.boundingClientRect,
          metadata: {
            isWithinChatView: false,
            isInputArea: true,
            sourceNodeName: anchorElement?.nodeName,
          },
        };

        return {
          stage: 'LOCATED',
          success: true,
          timestamp,
          traceId,
          data: result,
          metadata: result.metadata,
          error: null,
        };
      }

      // 4. Bẫy vùng ngoài Chat View (danh sách menu, cài đặt...)
      const isWithinChatView = this.domAdapter.isWithinChatView(anchorElement);
      if (!isWithinChatView) {
        const result: IZaloSelectionLocatorResult = {
          traceId,
          isValidSelection: false,
          targetElement: null,
          messageId: null,
          selectedText: rawSelection.selectedText,
          boundingClientRect: rawSelection.boundingClientRect,
          metadata: {
            isWithinChatView: false,
            isInputArea: false,
            sourceNodeName: anchorElement?.nodeName,
          },
        };

        return {
          stage: 'LOCATED',
          success: true,
          timestamp,
          traceId,
          data: result,
          metadata: result.metadata,
          error: null,
        };
      }

      // 5. Leo ngược cây DOM tìm phần tử bong bóng tin nhắn target
      const targetElement = this.domAdapter.findClosestMessageElement(anchorElement);
      const messageId = this.domAdapter.extractMessageId(targetElement ?? anchorElement);

      const result: IZaloSelectionLocatorResult = {
        traceId,
        isValidSelection: true,
        targetElement: targetElement ?? anchorElement,
        messageId,
        selectedText: rawSelection.selectedText,
        boundingClientRect: rawSelection.boundingClientRect,
        metadata: {
          isWithinChatView: true,
          isInputArea: false,
          containerClass: targetElement?.className || undefined,
          sourceNodeName: anchorElement?.nodeName,
        },
      };

      return {
        stage: 'LOCATED',
        success: true,
        timestamp,
        traceId,
        data: result,
        metadata: result.metadata,
        error: null,
      };
    } catch (err) {
      return {
        stage: 'LOCATED',
        success: false,
        timestamp,
        traceId,
        data: null,
        metadata: {
          isWithinChatView: false,
          isInputArea: false,
        },
        error: {
          code: AppErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown selection locator error',
          detail: err,
        },
      };
    }
  }
}

/**
 * Helper function định vị nhanh khi có sẵn Adapter và Input
 */
export function locateZaloSelection(
  adapter: IZaloSelectionDOMAdapter,
  input: IZaloSelectionLocatorInput
): Promise<IZaloSelectionLocatorOutput> {
  const module = new ZaloSelectionLocatorModule(adapter);
  return module.process(input);
}
