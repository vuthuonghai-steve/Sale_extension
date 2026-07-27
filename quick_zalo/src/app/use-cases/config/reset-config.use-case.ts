import type { IConfigService } from '../../ports/config.port';
import type { AppConfig, ConfigError } from '../../../domain/config/config.entity';
import type { Result } from '../../../shared/kernel/result';

export class ResetConfigUseCase {
  constructor(private readonly configService: IConfigService) {}

  async execute(): Promise<Result<AppConfig, ConfigError>> {
    return this.configService.resetToDefaults();
  }
}
