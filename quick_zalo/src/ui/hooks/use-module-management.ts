import { useCallback, useMemo } from 'react';
import { useAppConfig } from './use-app-config';
import { SidepanelBridgeService } from '@features/message-extraction/services/sidepanel-bridge.service';

const bridge = new SidepanelBridgeService();

export interface UseModuleManagementReturn {
  /** Map chứa trạng thái bật (true) / tắt (false) của từng moduleId */
  moduleStatuses: Record<string, boolean>;
  /** Kiểm tra một module có đang bật hay không (mặc định true nếu chưa set) */
  isModuleEnabled: (moduleId: string) => boolean;
  /** Bật hoặc tắt trạng thái của một module */
  toggleModule: (moduleId: string, enabled?: boolean) => Promise<void>;
  /** Đang tải cấu hình ban đầu */
  loading: boolean;
}

export function useModuleManagement(): UseModuleManagementReturn {
  const { config, loading, updateConfig } = useAppConfig();

  const moduleStatuses = useMemo(() => {
    return config?.features?.moduleStatuses ?? { 'message-extraction': true };
  }, [config]);

  const isModuleEnabled = useCallback(
    (moduleId: string): boolean => {
      const status = moduleStatuses[moduleId];
      return status !== undefined ? status : true;
    },
    [moduleStatuses]
  );

  const toggleModule = useCallback(
    async (moduleId: string, enabled?: boolean) => {
      const current = isModuleEnabled(moduleId);
      const nextState = enabled !== undefined ? enabled : !current;

      const newStatuses = {
        ...moduleStatuses,
        [moduleId]: nextState,
      };

      await updateConfig({
        features: {
          enableAutoSync: config?.features?.enableAutoSync ?? true,
          syncIntervalMinutes: config?.features?.syncIntervalMinutes ?? 15,
          enableNotifications: config?.features?.enableNotifications ?? true,
          moduleStatuses: newStatuses,
        },
      });

      // Nếu module là message-extraction, gửi thông báo tới Content Script để ngắt/bật lại DOM Observer
      if (moduleId === 'message-extraction') {
        void bridge.toggleObserver(nextState);
      }
    },
    [config, isModuleEnabled, moduleStatuses, updateConfig]
  );

  return {
    moduleStatuses,
    isModuleEnabled,
    toggleModule,
    loading,
  };
}
