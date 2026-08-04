/**
 * @file in-memory-event-bus.adapter.ts
 * @layer Infrastructure Layer (@infra/events)
 * @description Event Bus in-memory chạy trong RAM Content Script, cách ly lỗi handler khỏi luồng publish.
 */

import type { IEventBus, UnsubscribeFn } from '@shared/kernel/event-bus.interface';

type AnyHandler = (payload: unknown) => void;

export class InMemoryEventBusAdapter implements IEventBus {
  private readonly handlers = new Map<string, Set<AnyHandler>>();

  public subscribe<T>(event: string, handler: (payload: T) => void): UnsubscribeFn {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set<AnyHandler>();
      this.handlers.set(event, handlers);
    }
    handlers.add(handler as AnyHandler);

    return () => {
      handlers.delete(handler as AnyHandler);
    };
  }

  public publish<T>(event: string, payload: T): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        (handler as (payload: T) => void)(payload);
      } catch (error) {
        console.error(`[InMemoryEventBus] Handler error on event "${event}"`, error);
      }
    }
  }
}
