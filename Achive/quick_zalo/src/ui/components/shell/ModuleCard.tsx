import React from 'react';

export interface ModuleCardProps {
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  badge,
  enabled = true,
  onToggleEnabled,
  onClick,
}) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleEnabled?.(!enabled);
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={`group relative flex w-full flex-col gap-2.5 rounded-xl border p-4 text-left shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
        enabled
          ? 'border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md'
          : 'border-slate-200/60 bg-slate-50/70 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105 ${
              enabled
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-semibold transition-colors ${
                  enabled ? 'text-slate-800 group-hover:text-blue-600' : 'text-slate-500'
                }`}
              >
                {title}
              </h3>
              {badge && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-500/10">
                  {badge}
                </span>
              )}
              {/* Module Active / Inactive Status Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Switch Button */}
          {onToggleEnabled && (
            <button
              type="button"
              onClick={handleToggleClick}
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
          )}

          <div
            className={`transition-transform duration-200 ${
              enabled ? 'text-slate-400 group-hover:translate-x-1 group-hover:text-blue-500' : 'text-slate-300'
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
      <p
        className={`text-xs leading-relaxed line-clamp-2 pl-13 ${
          enabled ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {description}
      </p>
    </div>
  );
};
