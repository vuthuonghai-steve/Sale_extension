import type { LoggerConfig } from '../../shared/types/evlog.types';

export type Environment = 'development' | 'staging' | 'production';

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface FeatureFlagsConfig {
  enableAutoSync: boolean;
  syncIntervalMinutes: number;
  enableNotifications: boolean;
  moduleStatuses?: Record<string, boolean>;
}

export interface AppConfig {
  environment: Environment;
  api: ApiConfig;
  logger: LoggerConfig;
  features: FeatureFlagsConfig;
}

export type ConfigErrorReason =
  | 'INVALID_ENVIRONMENT'
  | 'INVALID_API_CONFIG'
  | 'INVALID_LOGGER_CONFIG'
  | 'INVALID_FEATURE_CONFIG'
  | 'STORAGE_ERROR';

export interface ConfigError {
  type: 'CONFIG_ERROR';
  reason: ConfigErrorReason;
  message: string;
}
