import React from 'react';
import { useDataNormalization } from '../hooks/useDataNormalization';
import { JsonUploader } from './components/JsonUploader';
import { ImportMetricsSummary } from './components/ImportMetricsSummary';
import { NormalizedCard } from './components/NormalizedCard';

export const DataNormalizationScreen: React.FC = () => {
  const {
    messages,
    metrics,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    elevatorFilter,
    setElevatorFilter,
    importJsonFile,
    clearStorage,
  } = useDataNormalization();

  const districts = [
    'Thanh Xuân', 'Đống Đa', 'Cầu Giấy', 'Ba Đình', 'Hai Bà Trưng',
    'Hoàn Kiếm', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Nam Từ Liêm', 'Hà Đông'
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4 text-slate-100 h-full max-h-full overflow-hidden">
      {/* Fixed Controls Header */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* Module Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>⚙️</span> Module Chuẩn Hóa Dữ Liệu & Lưu Trữ (Dexie DB)
            </h1>
            <p className="text-xs text-slate-400">
              Nạp file JSON datarow thô → Lọc trùng 2 cấp → Bóc tách trường dữ liệu → Hiển thị Dual View Debug
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearStorage}
              disabled={loading}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              🗑️ Xóa sạch DB
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-950/90 border border-rose-700/80 rounded-xl text-rose-200 text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* JSON File Uploader */}
        <JsonUploader onFileUpload={importJsonFile} loading={loading} />

        {/* Metrics Bar */}
        {metrics && <ImportMetricsSummary metrics={metrics} />}

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Tìm theo Mã, Địa chỉ, hoặc text thô..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Tất cả Quận/Huyện</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  Quận {d}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                setElevatorFilter(elevatorFilter === undefined ? true : elevatorFilter === true ? false : undefined)
              }
              className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                elevatorFilter === true
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : elevatorFilter === false
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-slate-950 border-slate-700 text-slate-300'
              }`}
            >
              🛗 {elevatorFilter === true ? 'Có Thang Máy' : elevatorFilter === false ? 'Không Thang Máy' : 'Thang Máy: Tất cả'}
            </button>

            <span className="text-slate-400 font-medium pl-1">
              Hiển thị: <strong className="text-cyan-400">{messages.length}</strong> bản ghi
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual View Message List — Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900/40 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        {loading && messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">⏳ Đang tải dữ liệu từ IndexedDB...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            📭 Chưa có bản ghi nào. Vui lòng chọn file JSON để nạp dữ liệu thô!
          </div>
        ) : (
          messages.map((item) => <NormalizedCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
};
