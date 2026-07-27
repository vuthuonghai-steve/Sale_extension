export const CONFIG_CONSTANTS = {
  STORAGE_KEYS: {
    APP_CONFIG: 'quick_zalo_app_config_v1',
    AUTH_TOKEN: 'quick_zalo_auth_token_v1',
  },
  DEFAULTS: {
    API_BASE_URL: 'http://localhost:3000',
    API_TIMEOUT_MS: 10000,
    API_MAX_RETRIES: 3,
    SYNC_INTERVAL_MINUTES: 15,
    ENABLE_AUTO_SYNC: true,
    ENABLE_NOTIFICATIONS: true,
    LOG_LEVEL: 'INFO' as const,
  },
  TARGET_ORIGINS: {
    ZALO_WEB: 'https://chat.zalo.me',
  },
} as const;
