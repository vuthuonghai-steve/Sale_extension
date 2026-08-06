import type { AppConfig, Environment } from '../../domain/config/config.entity';
import { DEFAULT_APP_CONFIG } from '../../domain/config/config.validator';

export function getStaticConfig(): AppConfig {
  // Extract environment variables if running under WXT / Vite build
  const envMode = (import.meta.env?.MODE as Environment) || 'development';
  const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || DEFAULT_APP_CONFIG.api.baseUrl;

  return {
    ...DEFAULT_APP_CONFIG,
    environment: ['development', 'staging', 'production'].includes(envMode) ? envMode : 'development',
    api: {
      ...DEFAULT_APP_CONFIG.api,
      baseUrl: apiBaseUrl,
    },
  };
}
