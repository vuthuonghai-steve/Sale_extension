import { describe, it, expect } from 'vitest';
import { DEFAULT_STORAGE_DATA } from '../../src/0_contracts/storage-schema.ts';

describe('StorageSchema', () => {
  it('should have valid default values', () => {
    expect(DEFAULT_STORAGE_DATA.settings.autoFillEnabled).toBe(true);
    expect(DEFAULT_STORAGE_DATA.settings.theme).toBe('dark');
    expect(DEFAULT_STORAGE_DATA.templates).toEqual({});
    expect(DEFAULT_STORAGE_DATA.history).toEqual([]);
  });
});
