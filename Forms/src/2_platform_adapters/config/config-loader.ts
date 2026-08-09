import type { EnvConfig } from '@contracts';

export class ConfigLoader {
  public static getEnvConfig(): EnvConfig {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    const env = meta.env ?? {};
    return {
      WXT_APP_NAME: env.WXT_APP_NAME ?? 'Forms Extension MV3',
      WXT_APP_DESCRIPTION:
        env.WXT_APP_DESCRIPTION ?? 'Chrome Extension Manifest V3 for Forms automation',
      WXT_LOG_LEVEL: (env.WXT_LOG_LEVEL as EnvConfig['WXT_LOG_LEVEL']) ?? 'info',
    };
  }
}
