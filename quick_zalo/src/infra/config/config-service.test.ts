import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from './config-service.adapter';
import type { IKeyValueStore } from '../../app/ports/storage.port';
import type { AppConfig } from '../../domain/config/config.entity';
import { DEFAULT_APP_CONFIG } from '../../domain/config/config.validator';
import { getStaticConfig } from './static-config';

class InMemoryStorage implements IKeyValueStore {
  private storeMap = new Map<string, any>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.storeMap.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storeMap.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storeMap.delete(key);
  }
}

describe('ConfigService Infra Adapter', () => {
  let storage: InMemoryStorage;
  let service: ConfigService;

  beforeEach(() => {
    storage = new InMemoryStorage();
    service = new ConfigService(storage);
  });

  it('should load default static config when storage is empty', async () => {
    const config = await service.getConfig();
    expect(config.environment).toBe('development');
    expect(config.api.baseUrl).toBe(getStaticConfig().api.baseUrl);
  });

  it('should update config and persist to storage', async () => {
    const updateResult = await service.updateConfig({
      environment: 'staging',
      features: { enableAutoSync: false, syncIntervalMinutes: 30, enableNotifications: true },
    });

    expect(updateResult.ok).toBe(true);
    if (updateResult.ok) {
      expect(updateResult.value.environment).toBe('staging');
      expect(updateResult.value.features.enableAutoSync).toBe(false);
    }

    const fetched = await service.getConfig();
    expect(fetched.environment).toBe('staging');
  });

  it('should notify subscribers when config changes', async () => {
    const listener = vi.fn();
    service.subscribe(listener);

    await service.updateConfig({ environment: 'production' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].environment).toBe('production');
  });

  it('should reset config to static defaults', async () => {
    await service.updateConfig({ environment: 'production' });
    const resetRes = await service.resetToDefaults();

    expect(resetRes.ok).toBe(true);
    if (resetRes.ok) {
      expect(resetRes.value.environment).toBe('development');
    }
  });

  it('should fail update when invalid input is provided', async () => {
    const res = await service.updateConfig({ environment: 'invalid' as any });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('INVALID_ENVIRONMENT');
    }
  });
});
