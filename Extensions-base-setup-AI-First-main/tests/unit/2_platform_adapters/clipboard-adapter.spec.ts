// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClipboardAdapter } from '../../../src/2_platform_adapters/clipboard/clipboard-adapter';

describe('ClipboardAdapter Platform Adapter', () => {
  let adapter: ClipboardAdapter;

  beforeEach(() => {
    adapter = new ClipboardAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-ADAPT-01: Ghi Clipboard thành công qua navigator.clipboard.writeText', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: writeTextSpy,
        },
      },
      writable: true,
      configurable: true,
    });

    const success = await adapter.writeText('Nội dung Zalo sạch 🍾');

    expect(success).toBe(true);
    expect(writeTextSpy).toHaveBeenCalledWith('Nội dung Zalo sạch 🍾');
  });

  it('UT-ADAPT-02: Hạ cấp Graceful Fallback sang execCommand("copy") khi writeText gặp NotAllowedError', async () => {
    const writeTextSpy = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const execCommandSpy = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: writeTextSpy,
        },
      },
      writable: true,
      configurable: true,
    });

    const mockTextarea = document.createElement('textarea');
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockTextarea);
    (document as unknown as Record<string, unknown>).execCommand = execCommandSpy;

    const success = await adapter.writeText('Nội dung fallback 🏢');

    expect(success).toBe(true);
    expect(writeTextSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith('textarea');
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
  });

  it('UT-ADAPT-03: Trả về false khi text null hoặc undefined', async () => {
    const success = await adapter.writeText(null as unknown as string);
    expect(success).toBe(false);
  });
});
