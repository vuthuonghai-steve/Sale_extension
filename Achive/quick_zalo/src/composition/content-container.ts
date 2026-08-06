import { InMemoryEventBusAdapter } from '@infra/events/in-memory-event-bus.adapter';
import { DexieMessageRepository } from '@infra/storage/dexie-message-repository.adapter';
import { EvlogLoggerAdapter } from '@infra/logging/evlog-logger.adapter';

export function createContentContainer() {
  return {
    extractDom() {
      return {
        title: document.title,
        text: document.body?.innerText ?? '',
      };
    },
    eventBus: new InMemoryEventBusAdapter(),
    messageRepository: new DexieMessageRepository(),
    logger: new EvlogLoggerAdapter(),
  };
}
