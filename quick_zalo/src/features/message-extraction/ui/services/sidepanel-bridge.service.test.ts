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
});
