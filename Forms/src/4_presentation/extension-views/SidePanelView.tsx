import React, { useState, useMemo } from 'react';
import type { LeadEntity, FormatSchema } from '@contracts';
import { DEFAULT_FORMAT_SCHEMAS } from '@contracts';
import { MessageParser } from '@modules/sub-modules/message-parser/index.ts';
import { FormatCard } from '../components/FormatCard.tsx';
import { LeadEntityEditor } from '../components/LeadEntityEditor.tsx';
import { FormScannerTab } from '../components/FormScannerTab.tsx';

export const SidePanelView: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [lead, setLead] = useState<LeadEntity>({});
  const [schemas, setSchemas] = useState<readonly FormatSchema[]>(DEFAULT_FORMAT_SCHEMAS);
  const [activeTab, setActiveTab] = useState<'formats' | 'editor' | 'scanner' | 'schemas'>('formats');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [customSchemaJson, setCustomSchemaJson] = useState<string>('');
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const hasLeadData = useMemo(() => {
    return Object.values(lead).some((val) => typeof val === 'string' && val.trim() !== '');
  }, [lead]);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const parsed = MessageParser.parse(rawText);
    setLead({ ...parsed, salesName: 'Thiên Ngọc' });
  };

  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    if (val.trim()) {
      const parsed = MessageParser.parse(val);
      setLead({ ...parsed, salesName: 'Thiên Ngọc' });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
      if (text.trim()) {
        setRawText(text);
        const parsed = MessageParser.parse(text);
        setLead({ ...parsed, salesName: 'Thiên Ngọc' });
        setCopyToast('Đã dán và phân tích tin nhắn!');
        setTimeout(() => setCopyToast(null), 1800);
      }
    } catch {
      // Ignored
    }
  };


  const handleClear = () => {
    setRawText('');
    setLead({});
  };

  const handleCopied = (name: string) => {
    setCopyToast(`Đã sao chép format ${name}!`);
    setTimeout(() => setCopyToast(null), 1800);
  };

  const handleAddCustomSchema = () => {
    setSchemaError(null);
    try {
      const parsed = JSON.parse(customSchemaJson) as FormatSchema;
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.fields)) {
        setSchemaError('Schema JSON phải chứa id, name và mảng fields.');
        return;
      }
      setSchemas((prev) => [...prev.filter((s) => s.id !== parsed.id), parsed]);
      setCustomSchemaJson('');
      setActiveTab('formats');
      setCopyToast(`Đã nạp schema ${parsed.name}!`);
      setTimeout(() => setCopyToast(null), 1800);
    } catch {
      setSchemaError('Cú pháp JSON không hợp lệ.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-3 gap-3 font-sans select-none antialiased">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-xs">
            ⚡
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-100 leading-tight">SaleForms Transformer</h1>
            <p className="text-[10px] text-slate-400">Bóc tách & Chuyển đổi format tự động</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasLeadData ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Đã trích xuất
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-900 border border-slate-800">
              Chờ tin nhắn
            </span>
          )}
        </div>
      </div>

      {/* Raw Input Box */}
      <div className="flex flex-col gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <span>📥</span>
            <span>Dán tin nhắn nguồn</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handlePasteFromClipboard();
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>📋</span>
              <span>Dán nhanh</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Xoá
              </button>
            )}
          </div>
        </div>

        <textarea
          data-testid="raw-message-input"
          value={rawText}
          onChange={handleRawTextChange}
          rows={3}
          className="w-full bg-slate-950 border border-slate-700/70 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y scrollbar-thin scrollbar-thumb-slate-800"
        />

        <div className="flex justify-between items-center pt-0.5">
          <span className="text-[10px] text-slate-500">
            {rawText ? `${rawText.split('\n').length} dòng` : 'Hỗ trợ tin Zalo, FB, Telegram'}
          </span>
          <button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
          >
            ⚡ Phân tích lại
          </button>
        </div>
      </div>

      {/* Quick Info Summary Chips */}
      {hasLeadData && (
        <div className="flex flex-wrap gap-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-[11px]">
          {lead.customerPhone && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-mono">
              ☎️ {lead.customerPhone}
            </span>
          )}
          {lead.customerName && (
            <span className="px-2 py-0.5 rounded-md bg-violet-950/70 text-violet-300 border border-violet-800/60 font-medium">
              👤 {lead.customerName}
            </span>
          )}
          {lead.price && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-medium">
              💸 {lead.price}
            </span>
          )}
          {lead.roomCode && (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-800/60 font-mono">
              🔑 {lead.roomCode}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold">
            💼 CTV: Thiên Ngọc
          </span>
        </div>
      )}


      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('formats')}
          className={`py-1.5 px-1 rounded-lg transition-all text-center text-[11px] truncate cursor-pointer ${
            activeTab === 'formats'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📋 Format ({schemas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`py-1.5 px-1 rounded-lg transition-all text-center text-[11px] truncate cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✏️ Sửa Lead
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`py-1.5 px-1 rounded-lg transition-all text-center text-[11px] truncate cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔍 Quét Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schemas')}
          className={`py-1.5 px-1 rounded-lg transition-all text-center text-[11px] truncate cursor-pointer ${
            activeTab === 'schemas'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚙️ Lite Schema
        </button>
      </div>

      {/* Floating Toast Notification */}
      {copyToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center shadow-lg flex items-center justify-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col gap-2.5 pb-2">
        {activeTab === 'formats' && (
          <div className="flex flex-col gap-2.5">
            {schemas.map((schema) => (
              <FormatCard
                key={schema.id}
                schema={schema}
                lead={lead}
                onCopied={() => handleCopied(schema.name)}
              />
            ))}
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-slate-400">
              Kiểm tra hoặc sửa nhanh thông tin chi tiết trích xuất được:
            </p>
            <LeadEntityEditor lead={lead} onChange={setLead} />
          </div>
        )}

        {activeTab === 'scanner' && <FormScannerTab currentLead={lead} />}

        {activeTab === 'schemas' && (
          <div className="flex flex-col gap-2.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <h2 className="text-xs font-semibold text-slate-200">
              ➕ Thêm Lite Schema mới (JSON)
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dán cấu trúc JSON schema của đối tác mới vào đây để UI tự động sinh thẻ format mới tức thì:
            </p>
            <textarea
              value={customSchemaJson}
              onChange={(e) => setCustomSchemaJson(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {schemaError && (
              <p className="text-[11px] text-rose-400 font-medium">⚠️ {schemaError}</p>
            )}
            <button
              type="button"
              onClick={handleAddCustomSchema}
              disabled={!customSchemaJson.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg self-end transition-all cursor-pointer"
            >
              Lưu & Áp dụng Schema
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
