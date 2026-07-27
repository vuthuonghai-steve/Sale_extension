import type { IConfigService } from '../../ports/config.port';
import type { AppConfig, ConfigError } from '../../../domain/config/config.entity';
import type { Result } from '../../../shared/kernel/result';

export class UpdateConfigUseCase {
  constructor(private readonly configService: IConfigService) {}

  async execute(partialConfig: Partial<AppConfig>): Promise<Result<AppConfig, ConfigError>> {
    return this.configService.updateConfig(partialConfig);
  }
}
