import type { AppConfig, ConfigError } from '@domain/config/config.entity';
import type { Result } from '@shared/kernel/result';

export interface IConfigService {
  getConfig(): Promise<AppConfig>;
  get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]>;
  updateConfig(partial: Partial<AppConfig>): Promise<Result<AppConfig, ConfigError>>;
  resetToDefaults(): Promise<Result<AppConfig, ConfigError>>;
  subscribe(listener: (config: AppConfig) => void): () => void;
}
