/**
 * Toast View Renderer cho Quick Action Extractor qua Shadow DOM.
 */
export class ToastView {
  private element: HTMLElement | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  public render(container: ShadowRoot | HTMLElement, message: string, durationMs = 2000): void {
    this.destroy();

    const toastNode = document.createElement('div');
    toastNode.className = 'zalo-quick-toast';
    toastNode.innerHTML = `
      <style>
        .zalo-quick-toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 999999;
          background: rgba(24, 119, 242, 0.95);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
      </style>
      <span>${message}</span>
    `;

    container.appendChild(toastNode);
    this.element = toastNode;

    requestAnimationFrame(() => {
      toastNode.classList.add('show');
    });

    this.timerId = setTimeout(() => {
      this.destroy();
    }, durationMs);
  }

  public destroy(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.element && this.element.parentNode) {
      this.element.classList.remove('show');
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}
