export interface ITabs {
  getActive(): Promise<{ id: number; url?: string } | null>;
  sendToTab<T>(tabId: number, message: unknown): Promise<T>;
}
