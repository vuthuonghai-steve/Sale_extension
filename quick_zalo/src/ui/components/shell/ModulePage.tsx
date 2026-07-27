import React from 'react';
import type { ModuleDef } from '@features/registry';

export interface ModulePageProps {
  module: ModuleDef;
  onBack: () => void;
}

export const ModulePage: React.FC<ModulePageProps> = ({
  module: mod,
  onBack,
}) => {
  const Component = mod.component;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans antialiased text-slate-800">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <svg
            className="h-4 w-4"
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

        <h2 className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
          {mod.title}
        </h2>

        <div className="w-16" />
      </header>

      {/* Module Content Container */}
      <main className="flex-1 w-full overflow-hidden">
        <Component />
      </main>
    </div>
  );
};
