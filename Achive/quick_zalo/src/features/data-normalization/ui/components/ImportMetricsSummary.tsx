import React from 'react';
import { IngestionMetricsEx } from '../../../../infra/storage/dexie-normalized-listing.adapter';
import { ImportSession } from '../../../../domain/data-normalization/entities/import-session.entity';

interface ImportMetricsSummaryProps {
  metrics?: IngestionMetricsEx | null;
  session?: ImportSession | null;
}

export const ImportMetricsSummary: React.FC<ImportMetricsSummaryProps> = ({ metrics, session }) => {
  if (!metrics && !session) return null;

  const totalInput = metrics?.totalInput ?? session?.totalMessages ?? 0;
  const dupesInFile = metrics?.dupesInFile ?? 0;
  const dupesInDb = metrics?.dupesInDb ?? 0;
  const newlyInserted = metrics?.newlyInserted ?? session?.uniqueListings ?? 0;
  const partialParsedCount = metrics?.partialParsedCount ?? session?.partialParsedCount ?? 0;

  const breakdown = metrics?.templateBreakdown ?? session?.templateBreakdown ?? {
    TNR: 0,
    Sky: 0,
    '95_Home': 0,
    unknown: 0,
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tổng số nạp</span>
          <span className="text-slate-100 text-sm font-bold">{totalInput}</span>
        </div>
        <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
          <span className="text-amber-400 block text-[10px] uppercase font-semibold">Trùng trong File</span>
          <span className="text-amber-300 text-sm font-bold">-{dupesInFile}</span>
        </div>
        <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
          <span className="text-rose-400 block text-[10px] uppercase font-semibold">Trùng với DB</span>
          <span className="text-rose-300 text-sm font-bold">-{dupesInDb}</span>
        </div>
        <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
          <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Thêm mới thành công</span>
          <span className="text-emerald-300 text-sm font-bold">+{newlyInserted}</span>
        </div>
        <div className="bg-orange-950/40 p-2 rounded-lg border border-orange-800/40">
          <span className="text-orange-400 block text-[10px] uppercase font-semibold">Chưa đầy đủ (Partial)</span>
          <span className="text-orange-300 text-sm font-bold">{partialParsedCount}</span>
        </div>
      </div>

      {/* Template Breakdown Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] px-1 flex-wrap gap-2">
        <span className="text-slate-400 font-medium">Phân loại Template Family:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <strong className="text-slate-200">TNR:</strong> <span className="text-cyan-400 font-bold">{breakdown.TNR}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <strong className="text-slate-200">Sky Group:</strong> <span className="text-indigo-400 font-bold">{breakdown.Sky}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            <strong className="text-slate-200">95 Home:</strong> <span className="text-pink-400 font-bold">{breakdown['95_Home']}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <strong className="text-slate-200">Khác / Thô:</strong> <span className="text-slate-400 font-bold">{breakdown.unknown}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
