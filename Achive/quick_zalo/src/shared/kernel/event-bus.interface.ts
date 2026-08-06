/**
 * @file event-bus.interface.ts
 * @layer Shared Kernel (@shared/kernel)
 * @description Giao diện Event Bus in-memory thuần TypeScript, decoupled Module Extraction vs Quick Search.
 */

export type UnsubscribeFn = () => void;

export interface IEventBus {
  publish<T>(event: string, payload: T): void;
  subscribe<T>(event: string, handler: (payload: T) => void): UnsubscribeFn;
}
