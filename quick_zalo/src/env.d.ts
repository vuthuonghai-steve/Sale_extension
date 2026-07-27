/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: 'development' | 'staging' | 'production';
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
