import type { CapturePageCommand } from './commands';
import type { GetSettingsQuery } from './queries';
import type { AppError } from './errors';

export type Message =
  | { type: 'command'; name: 'page.capture'; payload: CapturePageCommand }
  | { type: 'query'; name: 'settings.get'; payload: GetSettingsQuery }
  | { type: 'event'; name: 'page.captured'; payload: { tabId: number; url: string } };

export type MessageResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export type MessageName = Message['name'];
