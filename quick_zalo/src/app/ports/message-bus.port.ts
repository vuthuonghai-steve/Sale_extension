import type { Message, MessageResponse } from '@shared/contracts/messages';

export interface IMessageBus {
  request<T>(message: Message): Promise<MessageResponse<T>>;
  publish(message: Message): Promise<void>;
  on(
    name: Message['name'],
    handler: (msg: Message) => Promise<MessageResponse> | MessageResponse,
  ): () => void;
}
