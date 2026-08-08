import type { IKeyboardShortcutAdapter } from '../../0_contracts/zalo-quick-action.contract';

/**
 * Layer 2 — Platform Adapter lắng nghe phím tắt kích hoạt (Keyboard Shortcut Adapter).
 * Chuẩn hóa tổ hợp phím Alt + Q (Windows/Linux) và Option + Q (macOS).
 */
export class KeyboardShortcutAdapter implements IKeyboardShortcutAdapter {
  /**
   * Đăng ký lắng nghe tổ hợp phím tắt trên window/document.
   * Trao lại hàm unbind để hủy lắng nghe khi ngắt kết nối.
   */
  public registerShortcut(
    keyCombo: string,
    callback: (e: KeyboardEvent) => void
  ): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (e: KeyboardEvent): void => {
      if (this.matchesCombo(e, keyCombo)) {
        e.preventDefault();
        e.stopPropagation();
        callback(e);
      }
    };

    window.addEventListener('keydown', handler, true);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handler, true);
      }
    };
  }

  /**
   * Helper kiểm tra sự kiện phím gõ có khớp với keyCombo không
   */
  private matchesCombo(e: KeyboardEvent, keyCombo: string): boolean {
    const normalizedCombo = keyCombo.toUpperCase().trim();

    if (normalizedCombo === 'ALT+Q' || normalizedCombo === 'ALT + Q' || normalizedCombo === 'OPTION+Q') {
      const isAltOrOption = e.altKey;
      const isKeyQ = e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q';
      return isAltOrOption && isKeyQ;
    }

    return false;
  }
}
