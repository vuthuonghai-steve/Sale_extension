import { vi, beforeEach } from 'vitest';

// Global Chrome Extension API Mock Setup
const mockChromeStorageLocal = {
  get: vi.fn((key: string | string[]) => {
    return Promise.resolve(typeof key === 'string' ? { [key]: [] } : {});
  }),
  set: vi.fn((_data: Record<string, unknown>) => Promise.resolve()),
  remove: vi.fn((_key: string) => Promise.resolve()),
  clear: vi.fn(() => Promise.resolve()),
};

const mockChromeRuntime = {
  id: 'mock-extension-id',
  sendMessage: vi.fn(() => Promise.resolve({ success: true })),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Inject chrome API mock into global scope if missing
if (typeof globalThis.chrome === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).chrome = {
    storage: {
      local: mockChromeStorageLocal,
    },
    runtime: mockChromeRuntime,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});
