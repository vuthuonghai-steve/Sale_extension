import React from 'react';
import type { LeadEntity } from '@contracts';

export interface LeadEntityEditorProps {
  readonly lead: LeadEntity;
  readonly onChange: (updated: LeadEntity) => void;
}

export const LeadEntityEditor: React.FC<LeadEntityEditorProps> = ({ lead, onChange }) => {
  const handleFieldChange = (key: keyof LeadEntity, value: string) => {
    // Không cho phép chỉnh sửa trường salesName
    if (key === 'salesName') return;

    onChange({
      ...lead,
      [key]: value,
    });
  };

  const fields: Array<{
    key: keyof LeadEntity;
    label: string;
    guideText: string;
    icon: string;
    isFixed?: boolean;
  }> = [
    { key: 'customerName', label: 'Tên KH / Zalo', guideText: 'Tên khách hàng', icon: '👤' },
    { key: 'customerPhone', label: 'Số điện thoại', guideText: 'Số điện thoại', icon: '☎️' },
    { key: 'address', label: 'Địa chỉ phòng', guideText: 'Địa chỉ cụ thể', icon: '🏡' },
    { key: 'price', label: 'Mức giá', guideText: 'Mức giá phòng', icon: '💸' },
    { key: 'roomCode', label: 'Mã phòng', guideText: 'Mã phòng', icon: '🔑' },
    { key: 'viewTime', label: 'Thời gian xem', guideText: 'Giờ xem phòng', icon: '🕰️' },
    { key: 'salesName', label: 'Tên CTV', guideText: 'Cố định', icon: '💼', isFixed: true },
    { key: 'teamName', label: 'Team nguồn', guideText: 'Đội nhóm kinh doanh', icon: '🏢' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
      {fields.map((f) => {
        const isSales = f.key === 'salesName';
        const displayValue = isSales ? 'Thiên Ngọc' : (lead[f.key] || '');

        return (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </span>
              {f.isFixed ? (
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 font-semibold">
                  🔒 Cố định
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">{f.guideText}</span>
              )}
            </label>
            <input
              type="text"
              value={displayValue}
              readOnly={f.isFixed}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition-all ${
                f.isFixed
                  ? 'bg-slate-900/80 border-slate-700/60 text-amber-300 font-semibold cursor-not-allowed select-none'
                  : 'bg-slate-950 border-slate-700/80 text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
