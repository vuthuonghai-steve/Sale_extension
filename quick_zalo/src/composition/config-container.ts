import { BrowserStorage } from '@infra/browser/storage';
import { ConfigService } from '@infra/config/config-service.adapter';
import { GetConfigUseCase } from '@app/use-cases/config/get-config.use-case';
import { UpdateConfigUseCase } from '@app/use-cases/config/update-config.use-case';
import { ResetConfigUseCase } from '@app/use-cases/config/reset-config.use-case';

let configServiceInstance: ConfigService | null = null;

export function getConfigService(): ConfigService {
  if (!configServiceInstance) {
    const storage = new BrowserStorage('local');
    configServiceInstance = new ConfigService(storage);
  }
  return configServiceInstance;
}

export function createConfigContainer() {
  const configService = getConfigService();

  return {
    configService,
    getConfigUseCase: new GetConfigUseCase(configService),
    updateConfigUseCase: new UpdateConfigUseCase(configService),
    resetConfigUseCase: new ResetConfigUseCase(configService),
  };
}
