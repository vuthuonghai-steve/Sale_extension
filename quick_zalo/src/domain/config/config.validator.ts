import type { AppConfig, ConfigError } from './config.entity';
import { Result, ok, err } from '../../shared/kernel/result';

export const DEFAULT_APP_CONFIG: AppConfig = {
  environment: 'development',
  api: {
    baseUrl: 'https://api.quickzalo.local',
    timeoutMs: 10000,
    maxRetries: 3,
  },
  logger: {
    minLevel: 'INFO',
    maxCallsPerSec: 30,
    bufferCapacity: 5000,
    storageKey: 'evlog_ring_buffer',
    enableConsole: true,
    enableStorage: true,
  },
  features: {
    enableAutoSync: true,
    syncIntervalMinutes: 15,
    enableNotifications: true,
    moduleStatuses: {
      'message-extraction': true,
    },
  },
};

export function validateConfig(data: unknown): Result<AppConfig, ConfigError> {
  if (typeof data !== 'object' || data === null) {
    return err({
      type: 'CONFIG_ERROR',
      reason: 'INVALID_FEATURE_CONFIG',
      message: 'Config payload must be a non-null object',
    });
  }

  const raw = data as Partial<AppConfig>;

  // Validate environment
  const validEnvs = ['development', 'staging', 'production'];
  if (raw.environment && !validEnvs.includes(raw.environment)) {
    return err({
      type: 'CONFIG_ERROR',
      reason: 'INVALID_ENVIRONMENT',
      message: `Invalid environment '${raw.environment}'. Allowed: ${validEnvs.join(', ')}`,
    });
  }

  // Validate API
  if (raw.api) {
    if (typeof raw.api.timeoutMs === 'number' && raw.api.timeoutMs <= 0) {
      return err({
        type: 'CONFIG_ERROR',
        reason: 'INVALID_API_CONFIG',
        message: 'api.timeoutMs must be a positive number',
      });
    }
  }

  // Merge with defaults for missing nested fields
  const merged: AppConfig = {
    environment: raw.environment ?? DEFAULT_APP_CONFIG.environment,
    api: {
      ...DEFAULT_APP_CONFIG.api,
      ...(raw.api ?? {}),
    },
    logger: {
      ...DEFAULT_APP_CONFIG.logger,
      ...(raw.logger ?? {}),
    },
    features: {
      ...DEFAULT_APP_CONFIG.features,
      ...(raw.features ?? {}),
      moduleStatuses: {
        ...DEFAULT_APP_CONFIG.features.moduleStatuses,
        ...(raw.features?.moduleStatuses ?? {}),
      },
    },
  };

  return ok(merged);
}

export function mergeWithDefaults(partial: Partial<AppConfig>): AppConfig {
  const result = validateConfig(partial);
  if (result.ok) {
    return result.value;
  }
  return DEFAULT_APP_CONFIG;
}
