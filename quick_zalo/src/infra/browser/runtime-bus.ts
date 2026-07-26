import type { IMessageBus } from '@app/ports/message-bus.port';
import type { Message, MessageResponse } from '@shared/contracts/messages';

type Handler = (msg: Message) => Promise<MessageResponse> | MessageResponse;

export class RuntimeMessageBus implements IMessageBus {
  private handlers = new Map<Message['name'], Handler>();

  constructor() {
    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      const msg = raw as Message;
      const handler = this.handlers.get(msg.name);
      if (handler) {
        Promise.resolve(handler(msg)).then(sendResponse);
      } else {
        sendResponse({
          ok: false,
          error: { code: 'NOT_FOUND', message: `No handler: ${msg.name}` },
        } satisfies MessageResponse);
      }
      return true;
    });
  }

  on(name: Message['name'], handler: Handler) {
    this.handlers.set(name, handler);
    return () => this.handlers.delete(name);
  }

  async request<T>(message: Message): Promise<MessageResponse<T>> {
    return browser.runtime.sendMessage(message) as Promise<MessageResponse<T>>;
  }

  async publish(message: Message): Promise<void> {
    await browser.runtime.sendMessage(message);
  }
}
