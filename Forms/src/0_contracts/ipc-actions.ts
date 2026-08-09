export const IPC_ACTIONS = {
  // Form Operations
  FORM_EXTRACT_REQUEST: 'forms:extract:request',
  FORM_EXTRACT_RESPONSE: 'forms:extract:response',
  FORM_FILL_REQUEST: 'forms:fill:request',
  FORM_FILL_RESPONSE: 'forms:fill:response',

  // Storage Operations
  STORAGE_GET: 'storage:get',
  STORAGE_SET: 'storage:set',
  STORAGE_CHANGED: 'storage:changed',

  // Logging & Telemetry
  LOG_EVENT: 'telemetry:log_event',
  GET_LOGS: 'telemetry:get_logs',
  CLEAR_LOGS: 'telemetry:clear_logs',

  // Health / Ping
  PING: 'system:ping',
  PONG: 'system:pong',
} as const;

export type IpcAction = (typeof IPC_ACTIONS)[keyof typeof IPC_ACTIONS];
