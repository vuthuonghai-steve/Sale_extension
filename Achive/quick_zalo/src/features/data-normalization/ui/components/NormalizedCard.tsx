import React, { useState } from 'react';
import { NormalizedListing } from '../../../../domain/data-normalization/entities/normalized-listing.entity';

interface NormalizedCardProps {
  item: NormalizedListing;
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

  const renderTemplateBadge = () => {
    switch (item.templateFamily) {
      case 'TNR':
        return (
          <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 rounded text-[10px] font-semibold">
            TNR Template
          </span>
        );
      case 'Sky':
        return (
          <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 rounded text-[10px] font-semibold">
            Sky Group
          </span>
        );
      case '95_Home':
        return (
          <span className="px-2 py-0.5 bg-pink-950/80 text-pink-300 border border-pink-700/60 rounded text-[10px] font-semibold">
            95 Home
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/60 rounded text-[10px]">
            Text thô / Tự do
          </span>
        );
    }
  };

  const renderServiceFees = () => {
    const { serviceFees } = item;
    if (!serviceFees) return null;

    const hasAnyFee =
      serviceFees.electricity !== null ||
      serviceFees.water !== null ||
      serviceFees.internet !== null ||
      serviceFees.management !== null ||
      serviceFees.washingMachine !== null ||
      serviceFees.parking !== null ||
      serviceFees.raw;

    if (!hasAnyFee) return null;

    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
        <strong className="text-slate-400 block w-full text-[10px] uppercase font-semibold">Chi phí dịch vụ:</strong>
        {serviceFees.electricity !== null && (
          <span>⚡ Điện: <strong className="text-emerald-400">{formatVndPrice(serviceFees.electricity)}</strong>/kWh</span>
        )}
        {serviceFees.water !== null && (
          <span>💧 Nước: <strong className="text-emerald-400">{formatVndPrice(serviceFees.water)}</strong></span>
        )}
        {serviceFees.internet !== null && (
          <span>📶 Mạng: <strong className="text-emerald-400">{formatVndPrice(serviceFees.internet)}</strong>/tháng</span>
        )}
        {serviceFees.management !== null && (
          <span>🧹 Phí DV: <strong className="text-emerald-400">{formatVndPrice(serviceFees.management)}</strong></span>
        )}
        {serviceFees.washingMachine !== null && (
          <span>🧺 Máy giặt: <strong className="text-emerald-400">{formatVndPrice(serviceFees.washingMachine)}</strong></span>
        )}
        {serviceFees.parking !== null && (
          <span>🅿️ Xe: <strong className="text-emerald-400">{formatVndPrice(serviceFees.parking)}</strong></span>
        )}
        {!serviceFees.electricity && !serviceFees.water && serviceFees.raw && (
          <span className="text-slate-400 italic">{serviceFees.raw}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-slate-900/90 border rounded-xl p-3.5 shadow-md flex flex-col gap-2.5 transition-all hover:border-slate-700 ${
      item.isPartiallyParsed ? 'border-amber-800/70 bg-amber-950/10' : 'border-slate-800'
    }`}>
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {renderTemplateBadge()}

          {item.isPartiallyParsed && (
            <span className="px-2 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-700/80 rounded text-[10px] font-bold flex items-center gap-1">
              ⚠️ Bóc tách 1 phần
            </span>
          )}

          {item.code ? (
            <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 rounded text-xs font-bold font-mono">
              Mã: {item.code}
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">Chưa có mã</span>
          )}

          {item.commission !== null && (
            <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded text-xs font-bold">
              🌹 HH: {item.commission}%
            </span>
          )}

          {item.commissionCode && (
            <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded text-xs font-mono">
              Mã HH: {item.commissionCode}
            </span>
          )}

          {item.roomType && (
            <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded text-xs font-medium">
              🏠 {item.roomType}
            </span>
          )}

          {item.hasElevator === true && (
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded text-xs font-medium">
              🛗 Thang máy
            </span>
          )}

          {item.axis && (
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
              📍 {item.axis}
            </span>
          )}
        </div>

        {/* Formatted Price / Price Range */}
        <div className="text-right">
          {item.priceRange ? (
            <span className="text-emerald-400 font-bold text-sm">
              {formatVndPrice(item.priceRange.from)} - {formatVndPrice(item.priceRange.to)}
            </span>
          ) : item.priceNumeric ? (
            <span className="text-emerald-400 font-bold text-sm">
              {formatVndPrice(item.priceNumeric)}
            </span>
          ) : (
            <span className="text-amber-400 font-semibold text-xs">{item.priceRaw || 'Chưa rõ giá'}</span>
          )}
        </div>
      </div>

      {/* Address & District */}
      {item.address && (
        <div className="text-xs text-slate-200 flex items-start gap-1">
          <span className="text-rose-400 shrink-0">📍</span>
          <span className="font-medium">{item.address}</span>
          {item.district && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded shrink-0">
              Quận {item.district}
            </span>
          )}
          {item.area && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded shrink-0">
              {item.area} m²
            </span>
          )}
        </div>
      )}

      {/* Furniture */}
      {item.furniture && (
        <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
          <strong className="text-slate-400">Nội thất:</strong> {item.furniture}
        </div>
      )}

      {/* Service Fees */}
      {renderServiceFees()}

      {/* Policies & Notes */}
      {item.policies.length > 0 && (
        <div className="text-[11px] text-slate-400 flex flex-wrap gap-2">
          {item.policies.map((p, idx) => (
            <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
              📋 {p.description}
            </span>
          ))}
        </div>
      )}

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
