import type { IStageResult } from './zalo-extract.contract';

/**
 * Nguồn kích hoạt chi tiết cho Modul Chính zalo-quick-action-extractor
 */
export type ZaloQuickActionTriggerSource =
  | 'SHORTCUT_ON_SELECTION' // Người dùng bôi đen ký tự + bấm Alt+Q
  | 'FLOATING_BAR_CLICK'    // Người dùng bôi đen ký tự + bấm nút trên Floating Bar
  | 'SHORTCUT_HOVER'        // Người dùng hover tin nhắn + bấm Alt+Q
  | 'SHORTCUT_ALT_Q'        // Kích hoạt phím tắt chung
  | 'MOUSE_SELECTION'       // Kích hoạt qua bôi đen chuột
  | 'MANUAL_TRIGGER';       // Kích hoạt thủ công qua API/Test

/**
 * Standard Input Envelope cho composite module zalo-quick-action-extractor
 */
export interface IZaloQuickActionInput {
  /** Trace ID bắt buộc cho toàn bộ chuỗi quan sát (OBS-2 / G1-07) */
  traceId: string;

  /** Nguồn kích hoạt chi tiết */
  triggerSource: ZaloQuickActionTriggerSource;

  /** Nội dung đoạn text người dùng đang bôi đen (nếu có) */
  selectedText?: string;

  /** Phần tử DOM bong bóng tin nhắn Zalo Web (nếu có sẵn) */
  targetElement?: Element | null;

  /** Thời điểm kích hoạt */
  timestamp?: number;

  /** Tùy chọn nâng cao cho bộ lọc */
  filterOptions?: {
    filterBranding?: boolean;
    filterCommission?: boolean;
    extractOnlySelection?: boolean; // True: Chỉ lấy đoạn bôi đen; False: Lấy trọn vẹn cả tin nhắn
  };
}

/**
 * Metadata kết quả thực thi của Modul Chính
 */
export interface IZaloQuickActionMetadata {
  source: string;
  rawLength: number;
  sanitizedLength: number;
  hasEmoji: boolean;
  removedCommission: boolean;
  removedBranding: boolean;
  executionTimeMs: number;
  userGestureType: 'KEYBOARD_GESTURE' | 'CLICK_GESTURE' | 'FALLBACK';
}

/**
 * Output Result Contract cho Modul Chính
 */
export interface IZaloQuickActionResult {
  traceId: string;
  isSuccess: boolean;
  triggerSource: ZaloQuickActionTriggerSource;
  isPartialSelection: boolean;
  messageId: string | null;
  sanitizedText: string;
  originalText: string;
  copiedToClipboard: boolean;
  boundingClientRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
  metadata: IZaloQuickActionMetadata;
}

/**
 * Pipeline Stage Output Envelope cho composite module zalo-quick-action-extractor
 */
export type IZaloQuickActionOutput = IStageResult<
  'COPIED',
  IZaloQuickActionResult,
  IZaloQuickActionMetadata
>;

/**
 * Contract Interface cho Platform Clipboard Adapter
 */
export interface IClipboardAdapter {
  writeText(text: string): Promise<boolean>;
  readText?(): Promise<string>;
}

/**
 * Contract Interface cho Platform Keyboard Shortcut Adapter
 */
export interface IKeyboardShortcutAdapter {
  registerShortcut(
    keyCombo: string,
    callback: (e: KeyboardEvent) => void
  ): () => void;
}

/**
 * Contract Interface cho Platform Quick Action UI Adapter (Shadow DOM)
 */
export interface IQuickActionUIAdapter {
  showToast(message: string, durationMs?: number): void;
  showFloatingBar(
    rect: { top: number; left: number; width: number; height: number },
    text: string,
    actions: Array<{ label: string; onClick: () => void }>
  ): void;
  hideFloatingBar(): void;
  hideAll(): void;
}
