import { describe, expect, it, vi } from 'vitest';
import { SidepanelBridgeService } from './sidepanel-bridge.service';

describe('SidepanelBridgeService', () => {
  it('should subscribe to runtime messages correctly', () => {
    const addListenerSpy = vi.fn();
    const removeListenerSpy = vi.fn();

    // Mock browser.runtime
    (globalThis as unknown as Record<string, unknown>).browser = {
      runtime: {
        onMessage: {
          addListener: addListenerSpy,
          removeListener: removeListenerSpy,
        },
      },
    };

    const bridge = new SidepanelBridgeService();
    const onMessage = vi.fn();
    const unsubscribe = bridge.subscribeExtractedMessages(onMessage);

    expect(addListenerSpy).toHaveBeenCalledOnce();

    unsubscribe();
    expect(removeListenerSpy).toHaveBeenCalledOnce();
  });

  it('should send zalo.cache.clear message to active zalo tab', async () => {
    const sendMessageSpy = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as unknown as Record<string, unknown>).browser = {
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 101, url: 'https://chat.zalo.me' }]),
        sendMessage: sendMessageSpy,
      },
    };

    const bridge = new SidepanelBridgeService();
    const result = await bridge.clearMessageCache();

    expect(result).toBe(true);
    expect(sendMessageSpy).toHaveBeenCalledWith(101, { name: 'zalo.cache.clear' });
  });

  it('should send zalo.messages.rescan message and return extracted count', async () => {
    const sendMessageSpy = vi.fn().mockResolvedValue({ ok: true, data: { count: 5 } });
    (globalThis as unknown as Record<string, unknown>).browser = {
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 102, url: 'https://chat.zalo.me' }]),
        sendMessage: sendMessageSpy,
      },
    };

    const bridge = new SidepanelBridgeService();
    const count = await bridge.reExtractMessages();

    expect(count).toBe(5);
    expect(sendMessageSpy).toHaveBeenCalledWith(102, { name: 'zalo.messages.rescan' });
  });
});
