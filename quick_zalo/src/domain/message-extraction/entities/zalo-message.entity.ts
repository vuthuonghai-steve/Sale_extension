export interface ZaloMessage {
  id: string;
  conversationName: string;
  sender: string;
  isSelf: boolean;
  timestamp: string;
  rawText: string;
}
