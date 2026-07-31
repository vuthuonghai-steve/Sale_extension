/**
 * @file dom-selection.listener.ts
 * @layer Infrastructure Layer (@infra/listeners)
 * @description DOM Selection Listener intercepting mouseup events with debounce.
 */

export interface SelectionPayload {
  selectionFragment: string;
  targetElement: HTMLElement | null;
}

export class DOMSelectionListener {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly handleMouseUp: (event: MouseEvent) => void;

  constructor(
    private readonly callback: (payload: SelectionPayload) => void,
    private readonly container: HTMLElement = document.body,
    private readonly debounceMs = 150
  ) {
    this.handleMouseUp = (event: MouseEvent) => {
      const target = (event.target || event.srcElement) as HTMLElement | null;

      const selection = window.getSelection();
      const selectionText = selection ? selection.toString() : '';

      if (!selectionText) {
        return;
      }

      let targetElement: HTMLElement | null = target;
      if (selection && selection.anchorNode) {
        const anchorParent =
          selection.anchorNode.nodeType === 3
            ? selection.anchorNode.parentElement
            : (selection.anchorNode as HTMLElement);
        if (anchorParent) {
          targetElement = anchorParent;
        }
      }

      if (targetElement) {
        const tagName = targetElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'button') {
          return;
        }
        if (targetElement.closest?.('input, textarea, button')) {
          return;
        }
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.callback({
          selectionFragment: selectionText,
          targetElement,
        });
      }, this.debounceMs);
    };

    this.container.addEventListener('mouseup', this.handleMouseUp, true);
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.container.removeEventListener('mouseup', this.handleMouseUp, true);
  }
}
