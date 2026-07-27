import type { CapturePageCommand } from './commands';
import type { GetSettingsQuery } from './queries';
import type { AppError } from './errors';
import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';

export type Message =
  | { type: 'command'; name: 'page.capture'; payload: CapturePageCommand }
  | { type: 'query'; name: 'settings.get'; payload: GetSettingsQuery }
  | { type: 'event'; name: 'page.captured'; payload: { tabId: number; url: string } }
  | { type: 'event'; name: 'zalo.message.extracted'; payload: ZaloMessage }
  | { type: 'command'; name: 'zalo.observer.toggle'; payload: { enabled: boolean } }
  | {
      type: 'query';
      name: 'zalo.status.get';
      payload: Record<string, never>;
    };

export type MessageResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export type MessageName = Message['name'];
