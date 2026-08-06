/**
 * @file ring-buffer.service.ts
 * @layer Domain Layer (@domain/quick-search/services)
 * @description Bộ đệm xoay vòng FIFO N tin nhắn gần nhất (mặc định N=10, phạm vi 5-15),
 * loại bỏ trùng lặp theo hash: tin nhắn trùng được cập nhật và đưa lên đầu đệm.
 */

import type { BufferedMessageEntity } from '../entities/buffered-message.entity';

export const DEFAULT_RING_BUFFER_CAPACITY = 10;

export class RingBufferService {
  private readonly items: BufferedMessageEntity[] = [];

  constructor(private readonly capacity: number = DEFAULT_RING_BUFFER_CAPACITY) {}

  public push(message: BufferedMessageEntity): void {
    const existingIndex = this.items.findIndex((item) => item.hash === message.hash);

    if (existingIndex !== -1) {
      this.items.splice(existingIndex, 1);
      this.items.unshift(message);
      return;
    }

    this.items.unshift(message);
    if (this.items.length > this.capacity) {
      this.items.length = this.capacity;
    }
  }

  public getSnapshot(): BufferedMessageEntity[] {
    return [...this.items];
  }

  public clear(): void {
    this.items.length = 0;
  }
}
