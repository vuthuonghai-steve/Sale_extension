import React, { useState } from 'react';
import { NormalizedMessage } from '../../../../domain/data-normalization/entities/normalized-message.entity';

interface NormalizedCardProps {
  item: NormalizedMessage;
}

export const NormalizedCard: React.FC<NormalizedCardProps> = ({ item }) => {
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(item.data_raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatVndPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col gap-2.5 transition-all hover:border-slate-700">
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.code ? (
            <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 rounded text-xs font-bold font-mono">
              Mã: {item.code}
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">Chưa có mã</span>
          )}

          {item.roomType && (
            <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded text-xs font-medium">
              🏠 {item.roomType}
            </span>
          )}

          {item.hasElevator && (
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded text-xs font-medium">
              🛗 Thang máy
            </span>
          )}

          {item.availableRooms && (
            <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-800/60 rounded text-xs">
              ⏰ {item.availableRooms}
            </span>
          )}
        </div>

        {/* Formatted Price */}
        <div className="text-right">
          {item.priceNumeric ? (
            <span className="text-emerald-400 font-bold text-sm">
              {formatVndPrice(item.priceNumeric)}
            </span>
          ) : (
            <span className="text-amber-400 font-semibold text-xs">{item.priceRaw || 'Chưa rõ giá'}</span>
          )}
        </div>
      </div>

      {/* Address */}
      {item.address && (
        <div className="text-xs text-slate-200 flex items-start gap-1">
          <span className="text-rose-400 shrink-0">📍</span>
          <span className="font-medium">{item.address}</span>
          {item.district && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded shrink-0">
              Quận {item.district}
            </span>
          )}
        </div>
      )}

      {/* Furniture & Services */}
      {(item.furniture || Object.keys(item.services).length > 0) && (
        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col gap-1">
          {item.furniture && (
            <div>
              <strong className="text-slate-300">Nội thất:</strong> {item.furniture}
            </div>
          )}
          {Object.keys(item.services).length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-400">
              {item.services.electricity && <span>⚡ Điện: {item.services.electricity}</span>}
              {item.services.water && <span>💧 Nước: {item.services.water}</span>}
              {item.services.management && <span>🧹 Phí DV: {item.services.management}</span>}
              {item.services.washingMachine && <span>🧺 Giặt: {item.services.washingMachine}</span>}
            </div>
          )}
        </div>
      )}

      {/* Notes / Special Rules */}
      {item.notes.length > 0 && (
        <div className="text-[11px] text-slate-400">
          <span className="text-amber-400 font-medium">❌ Lưu ý:</span> {item.notes.slice(0, 2).join('; ')}
          {item.notes.length > 2 && <span className="text-slate-500"> (+{item.notes.length - 2})</span>}
        </div>
      )}

      {/* Footer Toggle for Raw Data Debugging */}
      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          <span>{showRaw ? '▲ Ẩn data_raw gốc' : '▼ Xem data_raw gốc (Debug)'}</span>
        </button>
        <span className="text-[10px] text-slate-500 font-mono">ID: {item.id}</span>
      </div>

      {/* Collapsible Raw Inspector */}
      {showRaw && (
        <div className="mt-1 bg-slate-950 rounded-lg p-2.5 border border-slate-800 relative">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="font-mono text-cyan-400">data_raw (Preserved Raw Text)</span>
            <button
              onClick={handleCopyRaw}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition-colors cursor-pointer"
            >
              {copied ? '✅ Đã copy' : '📋 Copy Raw'}
            </button>
          </div>
          <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed">
            {item.data_raw}
          </pre>
        </div>
      )}
    </div>
  );
};
