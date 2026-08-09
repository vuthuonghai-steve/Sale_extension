export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  urlPattern?: string;
  fieldMappings: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  autoFillEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableSoundNotification: boolean;
}

export interface StorageSchema {
  settings: AppSettings;
  templates: Record<string, FormTemplate>;
  lastActiveTemplateId?: string;
  history: Array<{
    id: string;
    templateId?: string;
    formUrl: string;
    timestamp: number;
    fieldsCount: number;
    status: 'success' | 'failed' | 'partial';
  }>;
}

export const DEFAULT_STORAGE_DATA: StorageSchema = {
  settings: {
    autoFillEnabled: true,
    theme: 'dark',
    logLevel: 'info',
    enableSoundNotification: false,
  },
  templates: {},
  history: [],
};
