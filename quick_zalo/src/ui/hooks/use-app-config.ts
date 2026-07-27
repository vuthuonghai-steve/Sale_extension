import { useState, useEffect, useCallback } from 'react';
import type { AppConfig, ConfigError } from '@domain/config/config.entity';
import { getConfigService } from '@composition/config-container';
import type { Result } from '@shared/kernel/result';

export interface UseAppConfigReturn {
  config: AppConfig | null;
  loading: boolean;
  updateConfig: (partial: Partial<AppConfig>) => Promise<Result<AppConfig, ConfigError>>;
  resetConfig: () => Promise<Result<AppConfig, ConfigError>>;
}

export function useAppConfig(): UseAppConfigReturn {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const configService = getConfigService();

    configService.getConfig().then((initialConfig) => {
      if (isMounted) {
        setConfig(initialConfig);
        setLoading(false);
      }
    });

    const unsubscribe = configService.subscribe((updatedConfig) => {
      if (isMounted) {
        setConfig(updatedConfig);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateConfig = useCallback(async (partial: Partial<AppConfig>) => {
    const configService = getConfigService();
    return await configService.updateConfig(partial);
  }, []);

  const resetConfig = useCallback(async () => {
    const configService = getConfigService();
    return await configService.resetToDefaults();
  }, []);

  return {
    config,
    loading,
    updateConfig,
    resetConfig,
  };
}
