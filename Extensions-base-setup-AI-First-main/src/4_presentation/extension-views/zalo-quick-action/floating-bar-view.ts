/**
 * Floating Bar View Renderer cho Quick Action Extractor qua Shadow DOM.
 * Hiển thị Mini Floating Bar tại vị trí selection boundingClientRect.
 */
export interface FloatingBarAction {
  label: string;
  onClick: () => void;
}

export class FloatingBarView {
  private element: HTMLElement | null = null;

  public render(
    container: ShadowRoot | HTMLElement,
    rect: { top: number; left: number; width: number; height: number },
    text: string,
    actions: FloatingBarAction[]
  ): void {
    this.destroy();

    const barNode = document.createElement('div');
    barNode.className = 'zalo-quick-floating-bar';

    // Tính toán toạ độ hiển thị (phía trên vùng selection)
    const topPos = Math.max(10, rect.top - 42);
    const leftPos = Math.max(10, rect.left + rect.width / 2 - 60);

    barNode.innerHTML = `
      <style>
        .zalo-quick-floating-bar {
          position: fixed;
          top: ${topPos}px;
          left: ${leftPos}px;
          z-index: 999999;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 4px 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .zalo-quick-bar-btn {
          background: #0068ff;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s ease;
        }
        .zalo-quick-bar-btn:hover {
          background: #0052cc;
        }
      </style>
      <div class="zalo-quick-bar-actions"></div>
    `;

    const actionsContainer = barNode.querySelector('.zalo-quick-bar-actions');

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = 'zalo-quick-bar-btn';
      btn.textContent = action.label;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        action.onClick();
      });
      actionsContainer?.appendChild(btn);
    });

    container.appendChild(barNode);
    this.element = barNode;

    requestAnimationFrame(() => {
      barNode.classList.add('show');
    });
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.classList.remove('show');
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}
