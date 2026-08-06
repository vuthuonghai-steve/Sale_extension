import type { IConfigService } from '../../app/ports/config.port';
import type { IKeyValueStore } from '../../app/ports/storage.port';
import type { AppConfig, ConfigError } from '../../domain/config/config.entity';
import { validateConfig, DEFAULT_APP_CONFIG } from '../../domain/config/config.validator';
import { getStaticConfig } from './static-config';
import { Result, ok, err } from '../../shared/kernel/result';

import { CONFIG_CONSTANTS } from '../../shared/constants/config.constants';

const CONFIG_STORAGE_KEY = CONFIG_CONSTANTS.STORAGE_KEYS.APP_CONFIG;

export class ConfigService implements IConfigService {
  private cachedConfig: AppConfig | null = null;
  private listeners: Set<(config: AppConfig) => void> = new Set();

  constructor(private readonly storage?: IKeyValueStore) {}

  public async getConfig(): Promise<AppConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const staticDefault = getStaticConfig();

    if (!this.storage) {
      this.cachedConfig = staticDefault;
      return this.cachedConfig;
    }

    try {
      const stored = await this.storage.get<Partial<AppConfig>>(CONFIG_STORAGE_KEY);
      if (!stored) {
        this.cachedConfig = staticDefault;
        return this.cachedConfig;
      }

      const validated = validateConfig(stored);
      if (validated.ok) {
        this.cachedConfig = validated.value;
      } else {
        this.cachedConfig = staticDefault;
      }
    } catch {
      this.cachedConfig = staticDefault;
    }

    return this.cachedConfig;
  }

  public async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  public async updateConfig(partial: Partial<AppConfig>): Promise<Result<AppConfig, ConfigError>> {
    const current = await this.getConfig();
    const updatedRaw: AppConfig = {
      ...current,
      ...partial,
      api: { ...current.api, ...(partial.api ?? {}) },
      logger: { ...current.logger, ...(partial.logger ?? {}) },
      features: { ...current.features, ...(partial.features ?? {}) },
    };

    const validated = validateConfig(updatedRaw);
    if (!validated.ok) {
      return err(validated.error);
    }

    const newConfig = validated.value;

    if (this.storage) {
      try {
        await this.storage.set(CONFIG_STORAGE_KEY, newConfig);
      } catch (error) {
        return err({
          type: 'CONFIG_ERROR',
          reason: 'STORAGE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to write config to storage',
        });
      }
    }

    this.cachedConfig = newConfig;
    this.notifyListeners(newConfig);

    return ok(newConfig);
  }

  public async resetToDefaults(): Promise<Result<AppConfig, ConfigError>> {
    const staticDefault = getStaticConfig();

    if (this.storage) {
      try {
        await this.storage.remove(CONFIG_STORAGE_KEY);
      } catch (error) {
        return err({
          type: 'CONFIG_ERROR',
          reason: 'STORAGE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reset config in storage',
        });
      }
    }

    this.cachedConfig = staticDefault;
    this.notifyListeners(staticDefault);

    return ok(staticDefault);
  }

  public subscribe(listener: (config: AppConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(config: AppConfig): void {
    this.listeners.forEach((listener) => listener(config));
  }
}
