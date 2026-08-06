import type { IConfigService } from '../../ports/config.port';
import type { AppConfig } from '../../../domain/config/config.entity';

export class GetConfigUseCase {
  constructor(private readonly configService: IConfigService) {}

  async execute(): Promise<AppConfig> {
    return this.configService.getConfig();
  }
}
