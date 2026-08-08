import type { IQuickActionUIAdapter } from '../../0_contracts/zalo-quick-action.contract';
import { FloatingBarView } from '../../4_presentation/extension-views/zalo-quick-action/floating-bar-view';
import { ToastView } from '../../4_presentation/extension-views/zalo-quick-action/toast-view';

/**
 * Layer 2 — Platform Adapter điều khiển giao diện UI qua Shadow DOM (ShadowDOMUIAdapter).
 * Mounts `#zalo-quick-action-root` trên document để cô lập CSS 100% với Zalo Web.
 */
export class ShadowDOMUIAdapter implements IQuickActionUIAdapter {
  private toastView = new ToastView();
  private floatingBarView = new FloatingBarView();

  /**
   * Hiển thị Toast thông báo phản hồi
   */
  public showToast(message: string, durationMs = 2000): void {
    const shadowRoot = this.getOrCreateShadowRoot();
    if (!shadowRoot) return;

    this.toastView.render(shadowRoot, message, durationMs);
  }

  /**
   * Hiển thị Mini Floating Bar tại toạ độ selection rect
   */
  public showFloatingBar(
    rect: { top: number; left: number; width: number; height: number },
    text: string,
    actions: Array<{ label: string; onClick: () => void }>
  ): void {
    const shadowRoot = this.getOrCreateShadowRoot();
    if (!shadowRoot) return;

    this.floatingBarView.render(shadowRoot, rect, text, actions);
  }

  /**
   * Ẩn Mini Floating Bar
   */
  public hideFloatingBar(): void {
    this.floatingBarView.destroy();
  }

  /**
   * Ẩn tất cả giao diện
   */
  public hideAll(): void {
    this.toastView.destroy();
    this.floatingBarView.destroy();
  }

  /**
   * Helper tạo hoặc lấy Shadow Root duy nhất của Extension trên DOM
   */
  private getOrCreateShadowRoot(): ShadowRoot | null {
    if (typeof document === 'undefined') {
      return null;
    }

    let host = document.getElementById('zalo-quick-action-root');

    if (!host) {
      host = document.createElement('div');
      host.id = 'zalo-quick-action-root';
      host.style.position = 'absolute';
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '0';
      host.style.height = '0';
      host.style.zIndex = '2147483647';
      const container = document.body ?? document.documentElement;
      if (container) {
        container.appendChild(host);
      } else {
        return null;
      }
    }

    return host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  }
}
