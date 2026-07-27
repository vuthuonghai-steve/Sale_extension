import { describe, it, expect } from 'vitest';
import { createConfigContainer, getConfigService } from './config-container';
import { CONFIG_CONSTANTS } from '@shared/constants/config.constants';

describe('Config Container & Shared Constants Integration', () => {
  it('should initialize ConfigService singleton properly', () => {
    const service1 = getConfigService();
    const service2 = getConfigService();

    expect(service1).toBe(service2);
  });

  it('should instantiate all config use cases in createConfigContainer', () => {
    const container = createConfigContainer();

    expect(container.configService).toBeDefined();
    expect(container.getConfigUseCase).toBeDefined();
    expect(container.updateConfigUseCase).toBeDefined();
    expect(container.resetConfigUseCase).toBeDefined();
  });

  it('should provide default values matching CONFIG_CONSTANTS', async () => {
    const container = createConfigContainer();
    const config = await container.getConfigUseCase.execute();

    expect(config.api.timeoutMs).toBe(CONFIG_CONSTANTS.DEFAULTS.API_TIMEOUT_MS);
    expect(config.features.enableAutoSync).toBe(CONFIG_CONSTANTS.DEFAULTS.ENABLE_AUTO_SYNC);
  });
});
