import type { IStageResult } from './zalo-extract.contract';

/**
 * Tọa độ hình chữ nhật bao quanh vùng bôi đen (Selection Range Bounding Box)
 */
export interface IZaloSelectionDOMRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Input Envelope cho sub-module zalo-selection-locator
 */
export interface IZaloSelectionLocatorInput {
  /** Trace ID bắt buộc cho toàn bộ chuỗi quan sát (G1-07 / OBS-2) */
  traceId: string;

  /** Thời điểm bắt đầu xử lý sự kiện */
  timestamp?: number;
}

/**
 * Dữ liệu Selection thô bóc tách từ DOM API (bởi Platform Adapter)
 */
export interface IZaloSelectionCapturedRaw {
  /** Nội dung văn bản người dùng bôi đen */
  selectedText: string;

  /** Node bắt đầu bôi đen */
  anchorNode: Node | null;

  /** Thẻ Element cha chung gần nhất chứa Selection Range */
  commonAncestorElement: Element | null;

  /** Tọa độ hình chữ nhật vùng bôi đen */
  boundingClientRect: IZaloSelectionDOMRect | null;
}

/**
 * Metadata thông tin vùng định vị
 */
export interface IZaloSelectionMetadata {
  /** Cờ xác nhận Selection nằm trong khu vực Chat View */
  isWithinChatView: boolean;

  /** Cờ phát hiện Selection thuộc vùng nhập liệu (Input Area) */
  isInputArea: boolean;

  /** Class CSS của container tin nhắn target */
  containerClass?: string;

  /** Thẻ HTML của phần tử gốc bôi đen */
  sourceNodeName?: string;

  /** Cờ phát hiện bôi đen kéo dài qua nhiều tin nhắn */
  isMultiMessage?: boolean;
}

/**
 * Output Result Envelope chuẩn hóa cho zalo-selection-locator
 */
export interface IZaloSelectionLocatorResult {
  /** Trace ID đồng bộ theo input */
  traceId: string;

  /** Cờ xác nhận Selection hợp lệ để kích hoạt trích xuất */
  isValidSelection: boolean;

  /** Thẻ Element bong bóng tin nhắn Zalo Web target */
  targetElement: Element | null;

  /** ID tin nhắn Zalo nếu tìm thấy trong thuộc tính data-id */
  messageId: string | null;

  /** Nội dung văn bản bôi đen */
  selectedText: string;

  /** Tọa độ hiển thị Quick Action / Floating UI */
  boundingClientRect: IZaloSelectionDOMRect | null;

  /** Metadata chi tiết */
  metadata: IZaloSelectionMetadata;
}

/**
 * Contract Interface cho Platform Adapter tương tác trực tiếp với DOM API
 */
export interface IZaloSelectionDOMAdapter {
  /** Đọc thông tin Selection hiện tại từ window.getSelection() */
  captureCurrentSelection(): IZaloSelectionCapturedRaw | null;

  /** Leo cây DOM từ anchorElement để tìm phần tử bong bóng tin nhắn target */
  findClosestMessageElement(anchorElement: Element | null): Element | null;

  /** Kiểm tra phần tử có nằm trong khung hội thoại Zalo Web không */
  isWithinChatView(element: Element | null): boolean;

  /** Kiểm tra phần tử có thuộc vùng nhập liệu / soạn thảo tin nhắn không */
  isInputArea(element: Element | null): boolean;

  /** Trích xuất messageId từ thuộc tính data-id hoặc id của phần tử */
  extractMessageId(element: Element | null): string | null;
}

/**
 * Pipeline Stage Output Envelope cho sub-module zalo-selection-locator
 */
export type IZaloSelectionLocatorOutput = IStageResult<
  'LOCATED',
  IZaloSelectionLocatorResult,
  IZaloSelectionMetadata
>;
