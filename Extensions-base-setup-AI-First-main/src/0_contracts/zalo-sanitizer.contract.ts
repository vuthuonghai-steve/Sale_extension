import type { IStageResult } from './zalo-extract.contract';

/**
 * Standard Input Envelope cho sub-module lọc & chuẩn hóa tin nhắn Zalo Web
 */
export interface IZaloMessageSanitizeInput {
  /** Trace ID bắt buộc cho toàn bộ chuỗi quan sát (OBS-2 / G1-07) */
  traceId: string;

  /** Chuỗi văn bản thô trích xuất từ DOM tin nhắn Zalo Web */
  rawText: string;

  /** Tùy chọn lọc nâng cao */
  options?: {
    filterBranding?: boolean;
    filterCommission?: boolean;
  };
}

/**
 * Dữ liệu tin nhắn sau khi đã được lọc và chuẩn hóa
 */
export interface IZaloSanitizedMessageData {
  /** Chuỗi văn bản sạch đã được lọc nhãn thương hiệu, hoa hồng, header quote, emoji orphan */
  sanitizedText: string;

  /** Văn bản gốc đầu vào chưa làm sạch */
  originalText: string;
}

/**
 * Metadata thông tin kết quả lọc
 */
export interface ZaloSanitizerMetadata {
  /** Nguồn xử lý (Mặc định: 'zalo-message-sanitizer') */
  source: string;

  /** Độ dài chuỗi văn bản thô đầu vào */
  rawLength: number;

  /** Độ dài chuỗi văn bản sạch đầu ra */
  sanitizedLength: number;

  /** Cờ xác nhận đã phát hiện và loại bỏ thông tin hoa hồng */
  removedCommission: boolean;

  /** Cờ xác nhận đã phát hiện và loại bỏ nhãn thương hiệu */
  removedBranding: boolean;

  /** Cờ phát hiện emoji trong văn bản */
  hasEmoji: boolean;
}

/**
 * Standard Output Envelope cho sub-module lọc & chuẩn hóa tin nhắn Zalo Web
 */
export type IZaloMessageSanitizeOutput = IStageResult<
  'SANITIZED',
  IZaloSanitizedMessageData,
  ZaloSanitizerMetadata
>;
