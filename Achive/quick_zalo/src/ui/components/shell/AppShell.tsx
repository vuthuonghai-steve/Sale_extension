import React from 'react';
import { useNavigation } from '@/ui/hooks/use-navigation';
import { MODULES } from '@features/registry';
import { HomeDashboard } from './HomeDashboard';
import { ModulePage } from './ModulePage';

export const AppShell: React.FC = () => {
  const { activeModule, navigateTo, goHome } = useNavigation();

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50">
      {activeModule === null ? (
        <HomeDashboard modules={MODULES} onSelect={navigateTo} />
      ) : (
        <ModulePage module={activeModule} onBack={goHome} />
      )}
    </div>
  );
};
