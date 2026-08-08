import { ClipboardAdapter } from '../../2_platform_adapters/clipboard/clipboard-adapter';
import { KeyboardShortcutAdapter } from '../../2_platform_adapters/keyboard/shortcut-adapter';
import { localDriver } from '../../2_platform_adapters/storage/local-driver';
import { createLogger, type Logger } from '../../2_platform_adapters/telemetry/logger';
import { ShadowDOMUIAdapter } from '../../2_platform_adapters/ui/shadow-dom-ui-adapter';
import { ZaloWebDOMAdapter } from '../../2_platform_adapters/zalo/zalo-dom-adapter';
import { ZaloSelectionDOMAdapter } from '../../2_platform_adapters/zalo/zalo-selection-adapter';
import { ZaloQuickActionExtractorModule } from '../../3_modules/composite-modules/zalo-quick-action-extractor';
import { ZaloExtractSingleMessageModule } from '../../3_modules/sub-modules/zalo-extract-single-message';
import { ZaloMessageSanitizerModule } from '../../3_modules/sub-modules/zalo-message-sanitizer';
import { ZaloSelectionLocatorModule } from '../../3_modules/sub-modules/zalo-selection-locator';

/**
 * Layer 4 — Content Script Orchestrator: zalo-quick-action-orchestrator.ts
 * Điều phối toàn bộ sự kiện DOM, phím tắt Alt + Q, cờ bật/tắt tính năng và UI trong Shadow DOM.
 * Tích hợp Logger quan sát thời gian thực & phản hồi tức thì với sự thay đổi config từ Popup Menu Home.
 */
export class ZaloQuickActionOrchestrator {
  private logger: Logger;
  private featureEnabled = true;
  private selectionAdapter: ZaloSelectionDOMAdapter;
  private zaloDomAdapter: ZaloWebDOMAdapter;
  private clipboardAdapter: ClipboardAdapter;
  private shortcutAdapter: KeyboardShortcutAdapter;
  private uiAdapter: ShadowDOMUIAdapter;

  private locatorModule: ZaloSelectionLocatorModule;
  private extractorModule: ZaloExtractSingleMessageModule;
  private sanitizerModule: ZaloMessageSanitizerModule;
  private compositeModule: ZaloQuickActionExtractorModule;

  private unbindShortcut: (() => void) | null = null;
  private unsubscribeStorage: (() => void) | null = null;
  private isProcessing = false;

  constructor() {
    this.logger = createLogger('zalo-quick-action-orchestrator');
    this.selectionAdapter = new ZaloSelectionDOMAdapter();
    this.zaloDomAdapter = new ZaloWebDOMAdapter();
    this.clipboardAdapter = new ClipboardAdapter();
    this.shortcutAdapter = new KeyboardShortcutAdapter();
    this.uiAdapter = new ShadowDOMUIAdapter();

    this.locatorModule = new ZaloSelectionLocatorModule(this.selectionAdapter);
    this.extractorModule = new ZaloExtractSingleMessageModule(this.zaloDomAdapter);
    this.sanitizerModule = new ZaloMessageSanitizerModule();

    this.compositeModule = new ZaloQuickActionExtractorModule(
      this.locatorModule,
      this.extractorModule,
      this.sanitizerModule,
      this.clipboardAdapter
    );
  }

  /**
   * Khởi chạy Orchestrator trên Content Script
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.location) return;

    // 1. Kiểm tra domain: Chạy trên Zalo Web (chat.zalo.me / zalo.me) và môi trường E2E local
    const host = window.location.hostname || '';
    if (!host.includes('zalo.me') && !host.includes('localhost') && host !== '127.0.0.1') {
      return;
    }

    // 2. Đọc cờ cài đặt feature toggle từ localDriver & đăng ký watch listener
    await this.loadFeatureToggle();
    this.watchFeatureToggle();

    // 3. Đăng ký sự kiện bôi đen (mouseup) và phím tắt Alt + Q
    this.bindEvents();

    this.logger.info('Khởi chạy ZaloQuickActionOrchestrator thành công trên Zalo Web', {
      url: window.location.href,
      featureEnabled: this.featureEnabled,
    });
  }

  /**
   * Đọc cờ bật/tắt tính năng từ storage (Safe Fallback)
   */
  private async loadFeatureToggle(): Promise<void> {
    try {
      const res = await localDriver.get('settings.feature_zalo_quick_action_enabled');
      if (res.ok && typeof res.data === 'boolean') {
        this.featureEnabled = res.data;
      } else {
        this.featureEnabled = true;
      }
    } catch {
      this.featureEnabled = true;
    }

    this.logger.info('Đã nạp trạng thái cờ Feature Toggle từ Storage', {
      featureEnabled: this.featureEnabled,
    });
  }

  /**
   * Lắng nghe sự thay đổi cờ cài đặt tức thì từ popup Menu Home
   */
  private watchFeatureToggle(): void {
    try {
      this.unsubscribeStorage = localDriver.subscribe((changes) => {
        if ('settings.feature_zalo_quick_action_enabled' in changes) {
          const change = changes['settings.feature_zalo_quick_action_enabled'];
          const newVal = change?.newValue;
          const prevVal = this.featureEnabled;
          this.featureEnabled = typeof newVal === 'boolean' ? newVal : true;

          this.logger.info('Cập nhật trạng thái Config Feature Toggle tức thì', {
            previousState: prevVal,
            newState: this.featureEnabled,
          });

          if (!this.featureEnabled) {
            this.uiAdapter.hideAll();
            this.uiAdapter.showToast('🛑 Tính năng Quick Copy Zalo đã BỊ TẮT trong Menu Home!', 2000);
          } else {
            this.uiAdapter.showToast('⚡ Tính năng Quick Copy Zalo đã ĐƯỢC BẬT (Alt + Q)!', 2000);
          }
        }
      });
    } catch {
      // Storage subscribe graceful fallback
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('zalo-qa-toggle-feature', (e: Event) => {
        const customEvt = e as CustomEvent<{ enabled: boolean }>;
        if (typeof customEvt.detail?.enabled === 'boolean') {
          this.featureEnabled = customEvt.detail.enabled;
          if (!this.featureEnabled) {
            this.uiAdapter.hideAll();
            this.uiAdapter.showToast('🛑 Tính năng Quick Copy Zalo đã BỊ TẮT trong Menu Home!', 2000);
          }
        }
      });
    }
  }

  /**
   * Helper kiểm thử / Override cờ bật tắt tính năng
   */
  public setFeatureEnabledForTesting(enabled: boolean): void {
    this.featureEnabled = enabled;
  }

  /**
   * Đăng ký listeners cho mouseup và keydown shortcut
   */
  private bindEvents(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('mouseup', this.handleMouseUp);
    }

    this.unbindShortcut = this.shortcutAdapter.registerShortcut('Alt+Q', this.handleShortcut);
  }

  /**
   * Hủy lắng nghe sự kiện
   */
  public destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
    if (this.unbindShortcut) {
      this.unbindShortcut();
      this.unbindShortcut = null;
    }
    if (this.unsubscribeStorage) {
      this.unsubscribeStorage();
      this.unsubscribeStorage = null;
    }
    this.uiAdapter.hideAll();
  }

  /**
   * Xử lý sự kiện nhả chuột mouseup (Hiển thị Mini Floating Bar)
   */
  private handleMouseUp = (): void => {
    if (!this.featureEnabled || this.isProcessing) return;

    setTimeout(() => {
      const traceId = `tr-mouse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      void this.locatorModule
        .process({ traceId, timestamp: Date.now() })
        .then((output) => {
          if (output.success && output.data?.isValidSelection && output.data.boundingClientRect) {
            const selectedText = output.data.selectedText;
            const rect = output.data.boundingClientRect;
            const targetElement = output.data.targetElement;

            this.logger.debug('Hiển thị Mini Floating Bar tại vị trí bôi đen', {
              traceId,
              selectedText,
              rect,
            });

            this.uiAdapter.showFloatingBar(rect, selectedText, [
              {
                label: '📋 Copy sạch',
                onClick: () => {
                  void this.runPipeline({
                    traceId: `tr-float-${Date.now()}`,
                    triggerSource: 'FLOATING_BAR_CLICK',
                    selectedText,
                    targetElement,
                  });
                },
              },
            ]);
          } else {
            this.uiAdapter.hideFloatingBar();
          }
        });
    }, 50);
  };

  /**
   * Xử lý khi bấm phím tắt Alt + Q
   */
  private handleShortcut = (): void => {
    const traceId = `tr-sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (!this.featureEnabled) {
      this.logger.info('Tính năng Quick Copy Zalo hiện đang bị tắt trong settings', { traceId });
      this.uiAdapter.showToast('⚠️ Tính năng Quick Copy Zalo hiện đang TẮT trong Menu Home!', 2000);
      return;
    }

    const rawSelection = this.selectionAdapter.captureCurrentSelection();
    if (rawSelection && this.selectionAdapter.isInputArea(rawSelection.commonAncestorElement)) {
      this.logger.warn('Selection nằm trong ô nhập liệu, bỏ qua shortcut', { traceId });
      return;
    }

    const selectedText = rawSelection?.selectedText?.trim();
    this.logger.info('Bắt sự kiện phím tắt Alt + Q', {
      traceId,
      hasSelection: !!selectedText,
      selectedText,
    });

    if (selectedText) {
      void this.runPipeline({
        traceId,
        triggerSource: 'SHORTCUT_ON_SELECTION',
        selectedText,
      });
    } else {
      void this.runPipeline({
        traceId,
        triggerSource: 'SHORTCUT_HOVER',
      });
    }
  };

  /**
   * Thực thi chuỗi pipeline trích xuất - lọc - copy
   */
  private async runPipeline(params: {
    traceId: string;
    triggerSource: 'SHORTCUT_ON_SELECTION' | 'FLOATING_BAR_CLICK' | 'SHORTCUT_HOVER';
    selectedText?: string;
    targetElement?: Element | null;
  }): Promise<void> {
    this.isProcessing = true;
    this.uiAdapter.hideFloatingBar();

    this.logger.info('Bắt đầu thực thi Pipeline Trích xuất Zalo', params);

    try {
      const output = await this.compositeModule.process({
        traceId: params.traceId,
        triggerSource: params.triggerSource,
        selectedText: params.selectedText,
        targetElement: params.targetElement,
      });

      if (output.success && output.data?.copiedToClipboard) {
        const msg = output.data.isPartialSelection
          ? '✅ Đã copy đoạn tin nhắn sạch!'
          : '✅ Đã copy toàn bộ tin nhắn sạch!';
        
        this.logger.info('Pipeline hoàn tất xuất sắc', {
          traceId: params.traceId,
          sanitizedText: output.data.sanitizedText,
          copiedToClipboard: true,
        });

        this.uiAdapter.showToast(msg, 2000);
      } else if (output.error) {
        this.logger.warn('Pipeline dừng hoặc gặp bẫy guard gate', {
          traceId: params.traceId,
          error: output.error,
        });

        if (output.error.message === 'SELECTION_INSIDE_INPUT_AREA') {
          return;
        }
        if (output.error.message === 'EMPTY_EXTRACTED_TEXT') {
          this.uiAdapter.showToast('⚠️ Tin nhắn không chứa nội dung văn bản để trích xuất!', 2200);
        } else {
          this.uiAdapter.showToast('⚠️ Vui lòng bôi đen hoặc chỉ chuột vào tin nhắn Zalo!', 2200);
        }
      }
    } catch (err) {
      this.logger.error('Lỗi không xác định khi thực thi pipeline', { traceId: params.traceId, err });
      this.uiAdapter.showToast('❌ Lỗi xử lý trích xuất tin nhắn!', 2200);
    } finally {
      this.isProcessing = false;
    }
  }
}

// Global auto-init with Singleton Guard to prevent duplicate instances
declare global {
  interface Window {
    __zalo_qa_orchestrator__?: ZaloQuickActionOrchestrator;
  }
}

if (typeof window !== 'undefined' && typeof window.location !== 'undefined' && window.location.hostname?.includes('zalo.me')) {
  if (!window.__zalo_qa_orchestrator__) {
    const orchestrator = new ZaloQuickActionOrchestrator();
    window.__zalo_qa_orchestrator__ = orchestrator;
    void orchestrator.init();
  }
}

