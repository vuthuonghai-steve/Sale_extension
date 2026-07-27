import { defaultMockHandlers } from './handlers';

export class MSWServerMock {
  private isListening = false;

  public listen(): void {
    this.isListening = true;
  }

  public resetHandlers(): void {
    // Reset any runtime handler overrides
  }

  public close(): void {
    this.isListening = false;
  }

  public getStatus(): boolean {
    return this.isListening;
  }

  public handleRequest(endpoint: keyof typeof defaultMockHandlers, param?: string) {
    if (!this.isListening) {
      throw new Error('MSW Server Mock is not listening');
    }
    if (endpoint === 'getContactInfo' && param) {
      return defaultMockHandlers.getContactInfo(param);
    }
    if (endpoint === 'syncLogs' && param) {
      return defaultMockHandlers.syncLogs(Number(param));
    }
    return { status: 404, data: null };
  }
}

export const mswServer = new MSWServerMock();
