import { describe, it, expect } from 'vitest';
import { MODULES } from './registry';

describe('Module Registry', () => {
  it('should export non-empty MODULES array', () => {
    expect(Array.isArray(MODULES)).toBe(true);
    expect(MODULES.length).toBeGreaterThan(0);
  });

  it('should contain message-extraction module with required fields', () => {
    const msgExtModule = MODULES.find((m) => m.id === 'message-extraction');
    expect(msgExtModule).toBeDefined();
    expect(msgExtModule?.title).toBe('Trích xuất tin nhắn');
    expect(typeof msgExtModule?.component).toBe('function');
  });

  it('should have unique module IDs', () => {
    const ids = MODULES.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
