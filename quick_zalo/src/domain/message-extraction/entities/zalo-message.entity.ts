/**
 * @file zalo-message.entity.ts
 * @layer Domain Layer (@domain/message-extraction)
 * @description Thực thể cốt lõi biểu diễn tin nhắn Zalo Web sau khi trích xuất.
 *
 * Trách nhiệm chính:
 * - Định nghĩa hợp đồng dữ liệu chuẩn của tin nhắn Zalo (ID, người gửi, thời gian, nội dung, cuộc trò chuyện).
 * - Định vị vị trí tương đối (`position: 'top' | 'bottom'`) phục vụ xếp thứ tự 2 chiều (cũ nối trên, mới nối dưới).
 * - Đảm bảo tính độc lập hoàn toàn với môi trường Browser DOM, Chrome API và React UI.
 */

export interface ZaloMessage {
  id: string;
  conversationName: string;
  sender: string;
  isSelf: boolean;
  timestamp: string;
  rawText: string;
  position?: 'top' | 'bottom';
}
