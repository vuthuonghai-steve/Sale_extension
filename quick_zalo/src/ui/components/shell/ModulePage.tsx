import React from 'react';
import type { ModuleDef } from '@features/registry';
import { useModuleManagement } from '../../hooks/use-module-management';

export interface ModulePageProps {
  module: ModuleDef;
  onBack: () => void;
}

export const ModulePage: React.FC<ModulePageProps> = ({
  module: mod,
  onBack,
}) => {
  const Component = mod.component;
  const { isModuleEnabled, toggleModule } = useModuleManagement();
  const enabled = isModuleEnabled(mod.id);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans antialiased text-slate-800">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Quay lại
        </button>

        <div className="flex items-center gap-2 truncate max-w-[170px]">
          <h2 className="text-xs font-bold text-slate-800 truncate">
            {mod.title}
          </h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold border shrink-0 ${
              enabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {enabled ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        {/* Quick Toggle Switch in Module Header */}
        <button
          type="button"
          onClick={() => void toggleModule(mod.id)}
          title={enabled ? 'Tắt module' : 'Bật module'}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            enabled ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </header>

      {/* Module Content Container */}
      <main className="flex-1 w-full overflow-hidden">
        <Component />
      </main>
    </div>
  );
};
