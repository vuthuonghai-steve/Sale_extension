import type { AppError } from './ipc-payloads';

/**
 * Standard Input Envelope cho sub-module trích xuất 1 tin nhắn Zalo Web
 */
export interface IZaloMessageExtractInput {
  /** Trace ID bắt buộc cho toàn bộ chuỗi quan sát (OBS-2 / G1-07) */
  traceId: string;

  /** Phần tử DOM bong bóng tin nhắn Zalo Web (Message Element Container) */
  targetElement?: Element | null;

  /** ID tin nhắn Zalo nếu có (lấy từ thuộc tính data-id của DOM) */
  messageId?: string;
}

export interface IZaloRawExtractResult {
  messageId: string | null;
  extractedText: string;
  containerClass?: string;
}

export interface IZaloDOMAdapter {
  extractMessageFromElement(targetElement: Element | null): IZaloRawExtractResult | null;
}

/**
 * Standard Pipeline Stage Envelope
 * Áp dụng chung cho MỌI sub-module trong hệ thống để kết hợp dạng Chain/Pipe.
 */
export interface IStageResult<TStage extends string, TData, TMetadata = Record<string, unknown>> {
  stage: TStage;
  success: boolean;
  timestamp: number;
  traceId: string;
  data: TData | null;
  metadata: TMetadata;
  error: AppError | null;
}

/**
 * Dữ liệu tin nhắn đã được trích xuất nguyên vẹn từ DOM Zalo Web
 */
export interface IZaloExtractedMessageData {
  /** ID duy nhất của tin nhắn Zalo Web nếu có */
  messageId: string | null;

  /** Nội dung văn bản nguyên vẹn trích xuất từ DOM (giữ nguyên \n và Emoji) */
  extractedText: string;
}

/**
 * Metadata thông tin trích xuất
 */
export interface ZaloExtractionMetadata {
  /** Nguồn trích xuất (Mặc định: 'zalo-web-dom-adapter') */
  source: string;

  /** CSS class name của container tin nhắn */
  containerClass?: string;

  /** Độ dài văn bản trích xuất */
  textLength: number;

  /** Cờ phát hiện emoji trong văn bản */
  hasEmoji: boolean;

  /** Cờ phát hiện dấu xuống dòng \n */
  hasNewline: boolean;
}

/**
 * Standard Output Envelope cho sub-module trích xuất 1 tin nhắn Zalo Web
 */
export type IZaloMessageExtractOutput = IStageResult<
  'EXTRACTED',
  IZaloExtractedMessageData,
  ZaloExtractionMetadata
>;
