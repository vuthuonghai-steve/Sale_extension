import React from 'react';
import type { FormatSchema, LeadEntity } from '@contracts';
import { TemplateEngine } from '@modules/sub-modules/template-engine/index.ts';
import { MiniCopyButton } from './MiniCopyButton.tsx';

export interface FormatCardProps {
  readonly schema: FormatSchema;
  readonly lead: LeadEntity;
  readonly onCopied?: () => void;
}

export const FormatCard: React.FC<FormatCardProps> = ({ schema, lead, onCopied }) => {
  const renderedText = TemplateEngine.render(lead, schema);
  const lineCount = renderedText ? renderedText.split('\n').length : 0;

  return (
    <div
      data-testid={`format-card-${schema.id}`}
      className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-sm shadow-inner">
            {schema.icon || '📋'}
          </div>
          <div>
            <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
              <span>{schema.name}</span>
              <span className="text-[10px] text-slate-500 font-normal">({lineCount} dòng)</span>
            </div>
            {schema.description && (
              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{schema.description}</div>
            )}
          </div>
        </div>

        <MiniCopyButton
          textToCopy={renderedText}
          label="Copy"
          onCopied={onCopied}
        />
      </div>

      <div className="bg-slate-950/90 rounded-lg p-2.5 font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800/80 max-h-48 overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800">
        {renderedText || <span className="text-slate-600 italic">Chưa có dữ liệu trích xuất...</span>}
      </div>
    </div>
  );
};
