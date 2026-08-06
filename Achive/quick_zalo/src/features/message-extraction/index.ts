import { MessageExtractionScreen } from './MessageExtractionScreen';

export const MODULE_ID = 'message-extraction' as const;

export const moduleMeta = {
  id: MODULE_ID,
  title: 'Trích xuất tin nhắn',
  description: 'Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON',
} as const;

export const Component = MessageExtractionScreen;
export { MessageExtractionScreen };
