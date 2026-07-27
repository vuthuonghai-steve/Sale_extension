import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';
import type { ZaloTabStatus } from '../types/sidepanel-ui.types';

export class SidepanelBridgeService {
  public subscribeExtractedMessages(onMessage: (msg: ZaloMessage) => void): () => void {
    const listener = (raw: unknown) => {
      try {
        const msg = raw as { name?: string; payload?: ZaloMessage };
        if (msg?.name === 'zalo.message.extracted' && msg.payload) {
          onMessage(msg.payload);
        }
      } catch (err) {
        console.warn('[SidepanelBridgeService] Error processing message event:', err);
      }
    };

    if (typeof browser !== 'undefined' && browser.runtime?.onMessage) {
      browser.runtime.onMessage.addListener(listener);
      return () => {
        try {
          browser.runtime.onMessage.removeListener(listener);
        } catch {
          // Ignore unmount error
        }
      };
    }

    return () => {};
  }

  public async fetchActiveZaloTabStatus(): Promise<ZaloTabStatus> {
    const fallbackStatus: ZaloTabStatus = { isConnected: false, isZaloWeb: false, activeConversation: '' };

    try {
      if (typeof browser === 'undefined' || !browser.tabs?.query) {
        return fallbackStatus;
      }

      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs?.[0];

      if (!activeTab || !activeTab.url || !activeTab.id) {
        return fallbackStatus;
      }

      const isZaloWeb = activeTab.url.includes('zalo.me');
      if (!isZaloWeb) {
        return fallbackStatus;
      }

      const res = (await browser.tabs.sendMessage(activeTab.id, { name: 'zalo.status.get' }).catch(() => undefined)) as
        | { ok: boolean; data?: { activeConversation: string } }
        | undefined;

      return {
        isConnected: true,
        isZaloWeb: true,
        activeConversation: res?.data?.activeConversation || 'Zalo Chat',
      };
    } catch (err) {
      console.warn('[SidepanelBridgeService] Failed to query Zalo tab status:', err);
      return fallbackStatus;
    }
  }

  public async clearMessageCache(): Promise<boolean> {
    try {
      if (typeof browser === 'undefined' || !browser.tabs?.query) {
        return false;
      }
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs?.[0];

      if (activeTab?.id && activeTab.url?.includes('zalo.me')) {
        await browser.tabs.sendMessage(activeTab.id, { name: 'zalo.cache.clear' }).catch(() => undefined);
        return true;
      }
    } catch (err) {
      console.warn('[SidepanelBridgeService] Failed to clear message cache:', err);
    }
    return false;
  }

  public async reExtractMessages(): Promise<number> {
    try {
      if (typeof browser === 'undefined' || !browser.tabs?.query) {
        return 0;
      }
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs?.[0];

      if (activeTab?.id && activeTab.url?.includes('zalo.me')) {
        const res = (await browser.tabs.sendMessage(activeTab.id, { name: 'zalo.messages.rescan' }).catch(() => undefined)) as
          | { ok: boolean; data?: { count: number } }
          | undefined;
        return res?.data?.count ?? 0;
      }
    } catch (err) {
      console.warn('[SidepanelBridgeService] Failed to re-extract messages:', err);
    }
    return 0;
  }
}
