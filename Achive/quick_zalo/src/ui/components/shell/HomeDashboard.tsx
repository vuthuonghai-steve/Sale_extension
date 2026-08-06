import React from 'react';
import type { ModuleDef } from '@features/registry';
import { ModuleCard } from './ModuleCard';
import { useModuleManagement } from '../../hooks/use-module-management';

export interface HomeDashboardProps {
  modules: ModuleDef[];
  onSelect: (module: ModuleDef) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  modules,
  onSelect,
}) => {
  const { isModuleEnabled, toggleModule } = useModuleManagement();

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans antialiased text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Header Banner */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-sm">
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              Quick Zalo Assistant
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Bộ công cụ hỗ trợ bán hàng Zalo Web
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-3.5 py-4">
        <div className="mb-3.5 px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tiện ích hệ thống ({modules.length})
          </h2>
        </div>

        {/* Modules List */}
        <div className="flex flex-col gap-2.5">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              badge={module.badge}
              icon={module.icon}
              enabled={isModuleEnabled(module.id)}
              onToggleEnabled={(enabled) => void toggleModule(module.id, enabled)}
              onClick={() => onSelect(module)}
            />
          ))}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white px-4 py-2.5 text-center text-[11px] text-slate-400">
        Quick Zalo Extension v0.1.0 • Clean Architecture
      </footer>
    </div>
  );
};
