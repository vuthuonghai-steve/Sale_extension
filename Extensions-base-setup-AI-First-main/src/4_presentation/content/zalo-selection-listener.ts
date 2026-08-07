import type { IZaloSelectionLocatorOutput } from '../../0_contracts/zalo-selection.contract';
import { ZaloSelectionDOMAdapter } from '../../2_platform_adapters/zalo/zalo-selection-adapter';
import { ZaloSelectionLocatorModule } from '../../3_modules/sub-modules/zalo-selection-locator';

export type ZaloSelectionHandler = (output: IZaloSelectionLocatorOutput) => void;

/**
 * Layer 4 — Presentation Content Script Listener
 * Đăng ký lắng nghe sự kiện DOM mouseup trên Zalo Web và điều phối luồng locator.
 */
export class ZaloSelectionListener {
  private adapter: ZaloSelectionDOMAdapter;
  private module: ZaloSelectionLocatorModule;
  private isListening = false;
  private handler: ZaloSelectionHandler | null = null;

  constructor() {
    this.adapter = new ZaloSelectionDOMAdapter();
    this.module = new ZaloSelectionLocatorModule(this.adapter);
  }

  /**
   * Bắt đầu lắng nghe sự kiện mouseup trên document
   */
  public start(onLocated?: ZaloSelectionHandler): void {
    if (this.isListening) {
      return;
    }

    if (onLocated) {
      this.handler = onLocated;
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('mouseup', this.handleMouseUp);
      this.isListening = true;
    }
  }

  /**
   * Dừng lắng nghe sự kiện
   */
  public stop(): void {
    if (!this.isListening) {
      return;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('mouseup', this.handleMouseUp);
      this.isListening = false;
    }
  }

  /**
   * Xử lý sự kiện mouseup khi người dùng nhả chuột
   */
  private handleMouseUp = (): void => {
    const traceId = `trace-sel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    void this.module
      .process({
        traceId,
        timestamp: Date.now(),
      })
      .then((output) => {
        if (output.success && output.data?.isValidSelection && this.handler) {
          this.handler(output);
        }
      });
  };
}
