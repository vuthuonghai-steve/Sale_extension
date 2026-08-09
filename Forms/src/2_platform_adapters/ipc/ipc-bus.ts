import type { IpcAction, IpcMessageEnvelope } from '@contracts';

export function createTraceId(): string {
  return `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export class IpcBus {
  public async sendToBackground<TPayload, TResponse>(
    action: IpcAction,
    payload: TPayload,
    traceId: string = createTraceId(),
  ): Promise<TResponse> {
    const envelope: IpcMessageEnvelope<TPayload> = {
      action,
      traceId,
      timestamp: Date.now(),
      payload,
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return await chrome.runtime.sendMessage(envelope);
    }
    throw new Error('Chrome runtime messaging API is not available');
  }

  public async sendToActiveTab<TPayload, TResponse>(
    action: IpcAction,
    payload: TPayload,
    traceId: string = createTraceId(),
  ): Promise<TResponse> {
    const envelope: IpcMessageEnvelope<TPayload> = {
      action,
      traceId,
      timestamp: Date.now(),
      payload,
    };

    if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.tabs?.sendMessage) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) {
        throw new Error('No active tab found');
      }
      return await chrome.tabs.sendMessage(activeTab.id, envelope);
    }

    throw new Error('Chrome tabs messaging API is not available');
  }
}

export const ipcBus = new IpcBus();
