import { useState, useCallback } from 'react';
import type { ModuleDef } from '@features/registry';

export interface NavigationState {
  /** Module đang được active, `null` nếu đang ở Home Dashboard */
  activeModule: ModuleDef | null;
  /** Điều hướng đến module được chỉ định */
  navigateTo: (module: ModuleDef) => void;
  /** Quay trở lại Home Dashboard */
  goHome: () => void;
}

/**
 * Hook quản lý trạng thái chuyển đổi giữa Home Dashboard và các Feature Modules.
 */
export function useNavigation(): NavigationState {
  const [activeModule, setActiveModule] = useState<ModuleDef | null>(null);

  const navigateTo = useCallback((module: ModuleDef) => {
    setActiveModule(module);
  }, []);

  const goHome = useCallback(() => {
    setActiveModule(null);
  }, []);

  return { activeModule, navigateTo, goHome };
}
