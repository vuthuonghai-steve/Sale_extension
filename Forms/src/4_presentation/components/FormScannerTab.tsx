import React, { useState } from 'react';
import type { FormFieldDescriptor, LeadEntity } from '@contracts';
import { FormValidator } from '@modules/sub-modules/form-validator/index.ts';
import { FormMatcher } from '@modules/sub-modules/form-matcher/index.ts';
import { logger } from '@platform/telemetry/logger.ts';
import { createTraceId } from '@platform/ipc/ipc-bus.ts';

export interface FormScannerTabProps {
  readonly currentLead: LeadEntity;
}

export const FormScannerTab: React.FC<FormScannerTabProps> = ({ currentLead }) => {
  const [fields, setFields] = useState<FormFieldDescriptor[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExtract = async () => {
    const traceId = createTraceId();
    logger.info('FormScanner', 'Quét form trên tab hiện tại', {}, traceId);
    setLoading(true);
    setStatusMsg(null);

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.tabs?.sendMessage) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const res: { data?: { fields?: FormFieldDescriptor[] } } | undefined =
            await chrome.tabs.sendMessage(tab.id, {
              action: 'forms:extract:request',
              traceId,
              timestamp: Date.now(),
              payload: {},
            });

          if (res?.data?.fields) {
            setFields(res.data.fields);
            setStatusMsg(`Đã quét được ${res.data.fields.length} trường trên trang.`);
          } else {
            setStatusMsg('Không tìm thấy trường form nào trên trang này.');
          }
        }
      }
    } catch (err) {
      logger.error('FormScanner', 'Lỗi khi quét form', { error: String(err) }, traceId);
      setStatusMsg('Không thể kết nối với tab hiện tại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    const traceId = createTraceId();
    if (fields.length === 0) return;

    setLoading(true);
    try {
      const fillData: Record<string, string> = {
        'Họ và tên': currentLead.customerName || '',
        'Số điện thoại': currentLead.customerPhone || '',
        'Địa chỉ': currentLead.address || '',
        'Giá': currentLead.price || '',
        'Mã phòng': currentLead.roomCode || '',
        'Thời gian': currentLead.viewTime || '',
        'Sales': currentLead.salesName || '',
      };

      const instructions = FormMatcher.generateFillInstructions(fields, fillData);
      const valueMap: Record<string, string | boolean | readonly string[]> = {};
      for (const item of instructions) {
        valueMap[item.fieldId] = item.value;
      }
      const validations = FormValidator.validateAll(fields, valueMap);

      const allValid = Object.values(validations).every((v) => v.isValid);
      if (!allValid) {
        setStatusMsg('Một số trường không hợp lệ.');
        return;
      }

      if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.tabs?.sendMessage) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'forms:fill:request',
            traceId,
            timestamp: Date.now(),
            payload: { instructions },
          });
        }
      }

      setStatusMsg(`Đã điền tự động thành công ${instructions.length} trường.`);
    } catch (err) {
      logger.error('FormScanner', 'Lỗi khi điền form', { error: String(err) }, traceId);
      setStatusMsg('Lỗi khi gửi lệnh điền form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2.5">
        <p className="text-xs text-slate-300">
          Tự động nhận diện các trường trong Google Forms hoặc Web Form trên tab đang mở và điền dữ liệu từ Lead hiện tại:
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void handleExtract();
            }}
            disabled={loading}
            className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Đang quét...' : '🔍 Quét Form trên Tab'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleAutoFill();
            }}
            disabled={loading || fields.length === 0}
            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            ⚡ Tự động điền
          </button>
        </div>

        {statusMsg && (
          <div className="text-[11px] font-medium p-2 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300">
            {statusMsg}
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-300">Danh sách trường tìm thấy ({fields.length}):</div>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                <span className="text-slate-200 font-medium">{f.label || f.name}</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{f.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
