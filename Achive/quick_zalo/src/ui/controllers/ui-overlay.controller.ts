/**
 * @file ui-overlay.controller.ts
 * @layer UI Layer (@ui/controllers)
 * @description Controller rendering UI Overlay elements (Alerts, Toasts, Badges) via Shadow DOM isolation.
 */

export interface CenterAlertOptions {
  title?: string;
  body?: string;
  message?: string;
  details?: string;
  matchType?: string;
  durationMs?: number;
}

export class UIOverlayController {
  private shadowHost: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private alertTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastWarningTimer: ReturnType<typeof setTimeout> | null = null;
  private toastInfoTimer: ReturnType<typeof setTimeout> | null = null;
  private toastErrorTimer: ReturnType<typeof setTimeout> | null = null;

  private ensureShadowHost(): ShadowRoot {
    if (!this.shadowHost) {
      let existingHost = document.getElementById('quick-zalo-shadow-host');
      if (!existingHost) {
        existingHost = document.createElement('div');
        existingHost.id = 'quick-zalo-shadow-host';
        document.body.appendChild(existingHost);
      }
      this.shadowHost = existingHost;
      this.shadowRoot =
        existingHost.shadowRoot || existingHost.attachShadow({ mode: 'open' });
    }
    return this.shadowRoot!;
  }

  public showCenterAlert(
    messageOrConfig: string | CenterAlertOptions,
    durationMs = 2500
  ): void {
    const root = this.ensureShadowHost();
    const config: CenterAlertOptions =
      typeof messageOrConfig === 'string'
        ? { message: messageOrConfig, body: messageOrConfig, durationMs }
        : messageOrConfig;

    const autoDuration = config.durationMs ?? durationMs;

    let alertContainer = root.querySelector('.quick-zalo-alert-container') as HTMLElement;
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.className = 'quick-zalo-alert-container';
      Object.assign(alertContainer.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#ffffff',
        border: '2px solid #ff4d4f',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 12px 32px rgba(255, 77, 79, 0.25)',
        zIndex: '999999',
        minWidth: '320px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(alertContainer);
    }

    const titleText = config.title || '⚠️ PHÁT HIỆN TIN NHẮN TRÙNG LẶP';
    const bodyText = config.body || config.message || 'Tin nhắn này đã tồn tại trong cơ sở dữ liệu.';

    alertContainer.innerHTML = `
      <h3 data-testid="center-alert-modal-title" style="margin: 0 0 10px 0; color: #cf1322; font-size: 16px; font-weight: 700;">${titleText}</h3>
      <div data-testid="center-alert-modal-body" style="font-size: 13px; color: #434343; line-height: 1.5;">${bodyText}</div>
    `;

    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
    }

    this.alertTimer = setTimeout(() => {
      alertContainer.remove();
      this.alertTimer = null;
    }, autoDuration);
  }

  public showSuccessToast(message: string, durationMs = 1500): void {
    const root = this.ensureShadowHost();

    let toastContainer = root.querySelector('.quick-zalo-toast-container') as HTMLElement;
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'quick-zalo-toast-container';
      Object.assign(toastContainer.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#52c41a',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(82, 196, 26, 0.3)',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(toastContainer);
    }

    toastContainer.innerHTML = `<span data-testid="success-toast-message">${message}</span>`;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      toastContainer.remove();
      this.toastTimer = null;
    }, durationMs);
  }

  public showToastWarning(message: string, durationMs = 1500): void {
    const root = this.ensureShadowHost();

    let toastContainer = root.querySelector('.quick-zalo-toast-warning-container') as HTMLElement;
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'quick-zalo-toast-warning-container';
      Object.assign(toastContainer.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#faad14',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(250, 173, 20, 0.3)',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(toastContainer);
    }

    toastContainer.innerHTML = `<span data-testid="warning-toast-message">${message}</span>`;

    if (this.toastWarningTimer) {
      clearTimeout(this.toastWarningTimer);
    }

    this.toastWarningTimer = setTimeout(() => {
      toastContainer.remove();
      this.toastWarningTimer = null;
    }, durationMs);
  }

  public showToastInfo(message: string, durationMs = 2000): void {
    const root = this.ensureShadowHost();

    let toastContainer = root.querySelector('.quick-zalo-toast-info-container') as HTMLElement;
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'quick-zalo-toast-info-container';
      Object.assign(toastContainer.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#1890ff',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(24, 144, 255, 0.3)',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(toastContainer);
    }

    toastContainer.innerHTML = `<span data-testid="info-toast-message">${message}</span>`;

    if (this.toastInfoTimer) {
      clearTimeout(this.toastInfoTimer);
    }

    this.toastInfoTimer = setTimeout(() => {
      toastContainer.remove();
      this.toastInfoTimer = null;
    }, durationMs);
  }

  public showToastError(message: string, durationMs = 3000): void {
    const root = this.ensureShadowHost();

    let toastContainer = root.querySelector('.quick-zalo-toast-error-container') as HTMLElement;
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'quick-zalo-toast-error-container';
      Object.assign(toastContainer.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#ff4d4f',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(255, 77, 79, 0.3)',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(toastContainer);
    }

    toastContainer.innerHTML = `<span data-testid="error-toast-message">${message}</span>`;

    if (this.toastErrorTimer) {
      clearTimeout(this.toastErrorTimer);
    }

    this.toastErrorTimer = setTimeout(() => {
      toastContainer.remove();
      this.toastErrorTimer = null;
    }, durationMs);
  }

  public mountModeBadge(label: string): void {
    const root = this.ensureShadowHost();
    let badgeContainer = root.querySelector('.quick-zalo-badge-container') as HTMLElement;
    if (!badgeContainer) {
      badgeContainer = document.createElement('div');
      badgeContainer.className = 'quick-zalo-badge-container';
      Object.assign(badgeContainer.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        backgroundColor: '#1890ff',
        color: '#ffffff',
        padding: '6px 12px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: '600',
        zIndex: '999999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
      root.appendChild(badgeContainer);
    }
    badgeContainer.innerHTML = `<span data-testid="mode-indicator-badge-label">${label}</span>`;
  }

  public unmountModeBadge(): void {
    if (this.shadowRoot) {
      const badge = this.shadowRoot.querySelector('.quick-zalo-badge-container');
      if (badge) {
        badge.remove();
      }
    }
  }

  public destroy(): void {
    if (this.alertTimer) clearTimeout(this.alertTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.toastWarningTimer) clearTimeout(this.toastWarningTimer);
    if (this.toastInfoTimer) clearTimeout(this.toastInfoTimer);
    if (this.toastErrorTimer) clearTimeout(this.toastErrorTimer);

    if (this.shadowHost) {
      this.shadowHost.remove();
      this.shadowHost = null;
      this.shadowRoot = null;
    }
  }
}
