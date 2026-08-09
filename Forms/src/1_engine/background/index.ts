import { defineBackground } from '#imports';
import { logger } from '@platform/telemetry/logger.ts';
import { createTraceId } from '@platform/ipc/ipc-bus.ts';
import { IPC_ACTIONS, type IpcMessageEnvelope } from '@contracts';

export default defineBackground(() => {
  const bootTraceId = createTraceId();
  logger.info('ServiceWorker', 'Background service worker initialized (Manifest V3)', {}, bootTraceId);

  // Kích hoạt cơ chế tự động mở SidePanel khi click vào Action Icon của Extension
  if (typeof chrome !== 'undefined' && chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err: unknown) => {
        logger.warn('ServiceWorker', 'Không thể setPanelBehavior cho sidePanel', { error: String(err) }, bootTraceId);
      });
  }

  chrome.runtime.onInstalled.addListener((details) => {
    const traceId = createTraceId();
    logger.info('ServiceWorker', `Extension installed: ${details.reason}`, { reason: details.reason }, traceId);
  });

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const envelope = message as IpcMessageEnvelope;
    if (!envelope || !envelope.action) return false;

    const traceId = envelope.traceId || createTraceId();
    logger.debug(
      'ServiceWorker',
      `Received IPC action: ${envelope.action}`,
      { from: sender.tab?.url || 'extension-view' },
      traceId,
    );

    if (envelope.action === IPC_ACTIONS.PING) {
      sendResponse({ action: IPC_ACTIONS.PONG, traceId, timestamp: Date.now(), payload: 'pong' });
      return true;
    }

    if (envelope.action === IPC_ACTIONS.GET_LOGS) {
      sendResponse({ logs: logger.getLogs() });
      return true;
    }

    if (envelope.action === IPC_ACTIONS.CLEAR_LOGS) {
      logger.clearLogs();
      sendResponse({ success: true });
      return true;
    }

    return false;
  });
});
