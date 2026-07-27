import React from 'react';

export interface ModuleCardProps {
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  badge,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                {title}
              </h3>
              {badge && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-500/10">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-500">
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
      <p className="text-xs leading-relaxed text-slate-500 line-clamp-2 pl-13">
        {description}
      </p>
    </button>
  );
};
