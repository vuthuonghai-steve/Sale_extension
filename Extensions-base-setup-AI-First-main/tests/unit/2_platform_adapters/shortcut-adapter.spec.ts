// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyboardShortcutAdapter } from '../../../src/2_platform_adapters/keyboard/shortcut-adapter';

describe('KeyboardShortcutAdapter Platform Adapter', () => {
  let adapter: KeyboardShortcutAdapter;

  beforeEach(() => {
    adapter = new KeyboardShortcutAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-ADAPT-04: Chuẩn hóa phím tắt Alt + Q trên Windows và Option + Q trên macOS', () => {
    const callback = vi.fn();
    const unbind = adapter.registerShortcut('Alt+Q', callback);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const event = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyQ',
      key: 'q',
    });

    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    unbind();
  });

  it('UT-ADAPT-05: Không kích hoạt callback khi gõ phím khác (không có Alt/Option)', () => {
    const callback = vi.fn();
    const unbind = adapter.registerShortcut('Alt+Q', callback);

    const event = new KeyboardEvent('keydown', {
      altKey: false,
      code: 'KeyQ',
      key: 'q',
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
    unbind();
  });

  it('UT-ADAPT-06: Hủy lắng nghe phím tắt cleanly khi gọi unbind', () => {
    const callback = vi.fn();
    const unbind = adapter.registerShortcut('Alt+Q', callback);

    unbind();

    const event = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyQ',
      key: 'q',
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });
});
