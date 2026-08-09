import type { IpcAction } from './ipc-actions.ts';
import type { ExtractedFormData, FormFillInstruction, FormFillResult } from './form-contract.ts';
import type { LogEntry } from './log-schema.ts';
import type { StorageSchema } from './storage-schema.ts';

export interface IpcMessageEnvelope<T = unknown> {
  readonly action: IpcAction;
  readonly traceId: string;
  readonly timestamp: number;
  readonly payload: T;
}

// Payloads
export interface FormExtractRequestPayload {
  readonly includeHidden?: boolean;
}

export interface FormExtractResponsePayload {
  readonly data: ExtractedFormData;
}

export interface FormFillRequestPayload {
  readonly instructions: readonly FormFillInstruction[];
}

export interface FormFillResponsePayload {
  readonly result: FormFillResult;
}

export interface StorageGetPayload {
  readonly key?: keyof StorageSchema;
}

export interface StorageSetPayload<K extends keyof StorageSchema = keyof StorageSchema> {
  readonly key: K;
  readonly value: StorageSchema[K];
}

export interface LogEventPayload {
  readonly entry: LogEntry;
}

export interface GetLogsResponsePayload {
  readonly logs: readonly LogEntry[];
}
