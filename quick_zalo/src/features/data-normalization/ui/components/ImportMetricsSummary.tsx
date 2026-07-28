import React from 'react';
import { IngestionMetrics } from '../../../../domain/data-normalization/entities/normalized-message.entity';

interface ImportMetricsSummaryProps {
  metrics: IngestionMetrics;
}

export const ImportMetricsSummary: React.FC<ImportMetricsSummaryProps> = ({ metrics }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 grid grid-cols-4 gap-2 text-center text-xs">
      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tổng số nạp</span>
        <span className="text-slate-100 text-sm font-bold">{metrics.totalInput}</span>
      </div>
      <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
        <span className="text-amber-400 block text-[10px] uppercase font-semibold">Trùng trong File</span>
        <span className="text-amber-300 text-sm font-bold">-{metrics.dupesInFile}</span>
      </div>
      <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
        <span className="text-rose-400 block text-[10px] uppercase font-semibold">Trùng với DB</span>
        <span className="text-rose-300 text-sm font-bold">-{metrics.dupesInDb}</span>
      </div>
      <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
        <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Thêm mới thành công</span>
        <span className="text-emerald-300 text-sm font-bold">+{metrics.newlyInserted}</span>
      </div>
    </div>
  );
};
