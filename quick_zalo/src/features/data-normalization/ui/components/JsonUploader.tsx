import React, { useRef } from 'react';

interface JsonUploaderProps {
  onFileUpload: (file: File) => void;
  loading: boolean;
}

export const JsonUploader: React.FC<JsonUploaderProps> = ({ onFileUpload, loading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-800/60 border-2 border-dashed border-cyan-500/40 rounded-xl p-4 text-center hover:border-cyan-400 transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl">📥</span>
        <h3 className="text-sm font-semibold text-slate-200">Nạp File JSON Dữ liệu Thô</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Chấp nhận file JSON chứa mảng <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">messages: [{"{"} id, data_raw {"}"}]</code>
        </p>
        <button
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium rounded-lg shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? '⏳ Đang Nạp & Lọc Trùng...' : '📂 Chọn File JSON'}
        </button>
      </div>
    </div>
  );
};
