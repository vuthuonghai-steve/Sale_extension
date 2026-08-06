import { cleanRawText } from '../utils/data-cleaner';
import { reconciliationEngine } from '../utils/reconciliation-engine';
import { listingRepository } from '../Data/Database/repository';
import type { ReconciliationResult, ImportCheckpoint } from '../utils/data-cleaner/types';

/**
 * ReconciliationView Component
 * Giao diện đối chiếu dữ liệu thô (Dataset 2) với Cơ sở dữ liệu mốc (Dataset 1)
 * trên Dashboard toàn màn hình.
 */
export class ReconciliationView {
  private container: HTMLElement;
  private currentResult: ReconciliationResult | null = null;
  private currentCheckpoint: ImportCheckpoint | null = null;
  private isProcessing = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async render(): Promise<void> {
    // Load checkpoint gần nhất
    this.currentCheckpoint = (await listingRepository.getImportCheckpoint()) || null;

    this.container.innerHTML = `
      <div class="reconciliation-view-wrapper">
        <!-- Header & Checkpoint Info Card -->
        <div class="reconcile-card">
          <div class="reconcile-header">
            <div>
              <div class="reconcile-title">
                <span>🔄</span> Đối Chiếu & Import Data Raw
              </div>
              <div class="reconcile-subtitle">
                So sánh dữ liệu thô mới nhập với Cơ sở dữ liệu mốc hiện tại để xác định vị trí chưa tồn tại & lưu mốc tiến độ.
              </div>
            </div>
            <div id="checkpoint-widget" class="reconcile-checkpoint-card">
              ${this.renderCheckpointWidget()}
            </div>
          </div>
        </div>

        <!-- Raw Data Input Card -->
        <div class="reconcile-card">
          <label style="font-size: 13px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
            <span>📥</span> Nạp Dữ Liệu Thô (Dán Text, File JSON/CSV hoặc Nguồn Tin Raw):
          </label>
          <textarea
            id="raw-import-input"
            class="reconcile-textarea"
            placeholder="Dán dữ liệu dòng tin thô phòng trọ tại đây (Ví dụ: Cho thuê phòng Nam Từ Liêm 3.5Tr full đồ...)..."
          ></textarea>
          
          <div class="reconcile-actions">
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="file" id="raw-file-input" accept=".json,.csv,.txt" style="display: none;" />
              <button id="btn-trigger-file" class="reconcile-btn-secondary">
                📁 Chọn File Data Thô
              </button>
              <span id="file-name-indicator" style="font-size: 12px; color: #94a3b8;"></span>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <button id="btn-reset-session" class="reconcile-btn-danger" title="Xóa danh sách chờ duyệt & reset mốc để import lại từ đầu">
                <span>🚫</span> Reject & Reset (Import Lại)
              </button>
              <button id="btn-run-reconcile" class="reconcile-btn-primary">
                <span>⚡</span> Bắt Đầu Đối Chiếu Data
              </button>
            </div>
          </div>
        </div>

        <!-- Results Area -->
        <div id="reconcile-results-area" style="display: flex; flex-direction: column; gap: 16px;" class="hidden">
          <!-- Summary KPI Cards -->
          <div id="kpi-summary-cards" class="reconcile-kpi-grid"></div>

          <!-- Comparison Table Section -->
          <div class="reconcile-table-wrapper">
            <div class="reconcile-table-header">
              <h3 style="font-size: 14px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                <span>📊</span> Bảng Chi Tiết Đối Chiếu Dữ Liệu
              </h3>
              <div style="display: flex; gap: 6px;">
                <button id="tab-filter-all" class="btn btn-xs btn-outline active-tab">Tất cả (<span id="count-all">0</span>)</button>
                <button id="tab-filter-new" class="btn btn-xs btn-outline" style="border-color: rgba(245,158,11,0.5); color: #fbbf24;">Chưa Có / Mới (<span id="count-new">0</span>)</button>
                <button id="tab-filter-matched" class="btn btn-xs btn-outline" style="border-color: rgba(16,185,129,0.5); color: #34d399;">Đã Tồn Tại (<span id="count-matched">0</span>)</button>
              </div>
            </div>

            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <table class="reconcile-table">
                <thead>
                  <tr>
                    <th>Trạng Thái</th>
                    <th>Quận/Huyện</th>
                    <th>Địa Chỉ / Tòa Nhà</th>
                    <th>Loại Phòng</th>
                    <th style="text-align: right;">Giá Thuê (VND)</th>
                    <th style="text-align: center;">Nguồn / Hash Match</th>
                    <th style="text-align: center;">Thao Tác</th>
                  </tr>
                </thead>
                <tbody id="diff-table-body">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderCheckpointWidget(): string {
    if (!this.currentCheckpoint) {
      return `
        <div class="text-xs text-slate-400">📍 Mốc Import Gần Nhất: <span class="text-slate-300">Chưa có dữ liệu</span></div>
      `;
    }
    const formattedDate = new Date(this.currentCheckpoint.lastUpdatedAt).toLocaleString('vi-VN');
    return `
      <div class="text-xs text-slate-400">
        📍 Mốc Địa Điểm Cuối Lượt Sau: <span class="text-amber-400 font-bold">${this.currentCheckpoint.lastLocationName}</span>
      </div>
      <div class="text-[11px] text-slate-500 mt-0.5">
        Đã xử lý ${this.currentCheckpoint.totalImported} dòng • Cập nhật: ${formattedDate}
      </div>
    `;
  }

  private attachEvents(): void {
    const btnFile = this.container.querySelector('#btn-trigger-file') as HTMLButtonElement;
    const fileInput = this.container.querySelector('#raw-file-input') as HTMLInputElement;
    const fileNameInd = this.container.querySelector('#file-name-indicator') as HTMLElement;
    const textarea = this.container.querySelector('#raw-import-input') as HTMLTextAreaElement;
    const btnRun = this.container.querySelector('#btn-run-reconcile') as HTMLButtonElement;

    const btnReset = this.container.querySelector('#btn-reset-session') as HTMLButtonElement;

    btnFile?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        fileNameInd.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            textarea.value = String(evt.target.result);
          }
        };
        reader.readAsText(file);
      }
    });

    btnRun?.addEventListener('click', () => this.handleRunReconciliation());
    btnReset?.addEventListener('click', () => this.handleResetSession());
  }

  private async handleResetSession(): Promise<void> {
    const confirmReset = confirm(
      'Bạn có chắc chắn muốn Reject toàn bộ danh sách chờ duyệt & Reset mốc địa điểm import gần nhất để tiến hành import lại từ đầu?'
    );
    if (!confirmReset) return;

    try {
      await listingRepository.resetReconciliationSession();
      this.currentResult = null;
      this.currentCheckpoint = null;

      const cpWidget = this.container.querySelector('#checkpoint-widget');
      if (cpWidget) cpWidget.innerHTML = this.renderCheckpointWidget();

      const resultsArea = this.container.querySelector('#reconcile-results-area') as HTMLElement;
      resultsArea?.classList.add('hidden');

      alert('✅ Đã reset toàn bộ phiên import. Bạn có thể dán dữ liệu thô và tiến hành import lại!');
    } catch (err: any) {
      alert(`❌ Lỗi khi reset phiên import: ${err.message}`);
    }
  }

  private async handleRunReconciliation(): Promise<void> {
    const textarea = this.container.querySelector('#raw-import-input') as HTMLTextAreaElement;
    const rawText = textarea.value.trim();

    if (!rawText) {
      alert('Vui lòng dán dữ liệu dòng tin thô hoặc nạp file data để tiến hành đối chiếu!');
      return;
    }

    this.isProcessing = true;
    const btnRun = this.container.querySelector('#btn-run-reconcile') as HTMLButtonElement;
    btnRun.disabled = true;
    btnRun.innerHTML = `<span>⏳</span> Đang chuẩn hóa & đối chiếu...`;

    try {
      // 1. Chạy Data Cleaner chuyển đổi rawText thành CleanListingRecord[]
      const cleanedRecords = await cleanRawText(rawText);

      if (cleanedRecords.length === 0) {
        alert('Không tìm thấy bản ghi hợp lệ nào trong dữ liệu thô nạp vào!');
        return;
      }

      // 2. Chạy ReconciliationEngine đối chiếu với DB mốc
      const result = await reconciliationEngine.reconcile(cleanedRecords, 'USER_MANUAL_IMPORT');
      this.currentResult = result;

      // 3. Cập nhật Checkpoint UI
      this.currentCheckpoint = result.checkpoint;
      const cpWidget = this.container.querySelector('#checkpoint-widget');
      if (cpWidget) cpWidget.innerHTML = this.renderCheckpointWidget();

      // 4. Render kết quả đối chiếu
      this.renderResults(result);
    } catch (err: any) {
      console.error('[ReconciliationView] Error reconciling data:', err);
      alert(`Đã xảy ra lỗi trong quá trình đối chiếu: ${err.message}`);
    } finally {
      this.isProcessing = false;
      btnRun.disabled = false;
      btnRun.innerHTML = `<span>⚡</span> Bắt Đầu Đối Chiếu Data`;
    }
  }

  private renderResults(result: ReconciliationResult): void {
    const resultsArea = this.container.querySelector('#reconcile-results-area') as HTMLElement;
    resultsArea?.classList.remove('hidden');

    // Render KPI Summary Cards
    const kpiContainer = this.container.querySelector('#kpi-summary-cards') as HTMLElement;
    kpiContainer.innerHTML = `
      <div class="reconcile-kpi-card" style="border-color: rgba(59, 130, 246, 0.3);">
        <div class="reconcile-kpi-title">Tổng Dòng Thô Nạp Vào</div>
        <div class="reconcile-kpi-val" style="color: #60a5fa;">${result.totalInputRows}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Bản ghi đã qua cleaner</div>
      </div>
      <div class="reconcile-kpi-card" style="border-color: rgba(16, 185, 129, 0.3);">
        <div class="reconcile-kpi-title">Đã Tồn Tại Trong DB</div>
        <div class="reconcile-kpi-val" style="color: #34d399;">${result.existingMatchedList.length}</div>
        <div style="font-size: 11px; color: #10b981; margin-top: 4px;">Trùng khớp 100% vị trí & phòng</div>
      </div>
      <div class="reconcile-kpi-card" style="border-color: rgba(245, 158, 11, 0.3);">
        <div class="reconcile-kpi-title">Chưa Tồn Tại (Nơi Mới)</div>
        <div class="reconcile-kpi-val" style="color: #fbbf24;">${result.newPendingList.length}</div>
        <div style="font-size: 11px; color: #f59e0b; margin-top: 4px;">Chờ duyệt merge tại Sidepanel</div>
      </div>
      <div class="reconcile-kpi-card" style="border-color: rgba(168, 85, 247, 0.3);">
        <div class="reconcile-kpi-title">📍 Mốc Điểm Cuối Lượt Sau</div>
        <div style="font-size: 13px; font-weight: 700; color: #c084fc; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${result.checkpoint.lastLocationName}
        </div>
        <div style="font-size: 11px; color: #a855f7; margin-top: 4px;">Lưu vị trí dừng import</div>
      </div>
    `;

    // Counters
    const cAll = this.container.querySelector('#count-all') as HTMLElement;
    const cNew = this.container.querySelector('#count-new') as HTMLElement;
    const cMatched = this.container.querySelector('#count-matched') as HTMLElement;

    if (cAll) cAll.textContent = String(result.totalInputRows);
    if (cNew) cNew.textContent = String(result.newPendingList.length);
    if (cMatched) cMatched.textContent = String(result.existingMatchedList.length);

    // Render Table Rows
    this.renderTableRows('ALL');

    // Attach Tab Filters
    const tabAll = this.container.querySelector('#tab-filter-all');
    const tabNew = this.container.querySelector('#tab-filter-new');
    const tabMatched = this.container.querySelector('#tab-filter-matched');

    tabAll?.addEventListener('click', () => this.renderTableRows('ALL'));
    tabNew?.addEventListener('click', () => this.renderTableRows('NEW'));
    tabMatched?.addEventListener('click', () => this.renderTableRows('MATCHED'));
  }

  private renderTableRows(filterType: 'ALL' | 'NEW' | 'MATCHED'): void {
    if (!this.currentResult) return;

    const tbody = this.container.querySelector('#diff-table-body') as HTMLElement;
    tbody.innerHTML = '';

    const rows: Array<{
      statusType: 'NEW' | 'MATCHED';
      district: string;
      address: string;
      roomType: string;
      priceVnd: number;
      hash: string;
      rawText: string;
    }> = [];

    if (filterType === 'ALL' || filterType === 'NEW') {
      this.currentResult.newPendingList.forEach((item) => {
        rows.push({
          statusType: 'NEW',
          district: item.district || 'N/A',
          address: item.address || 'N/A',
          roomType: item.roomType || 'N/A',
          priceVnd: item.priceVnd || 0,
          hash: item.fingerprintHash || item.locationHash || 'N/A',
          rawText: item.rawText || (item.rawRef as string) || item.address || '',
        });
      });
    }

    if (filterType === 'ALL' || filterType === 'MATCHED') {
      this.currentResult.existingMatchedList.forEach((item) => {
        rows.push({
          statusType: 'MATCHED',
          district: item.district || 'N/A',
          address: item.address || 'N/A',
          roomType: item.roomType || 'N/A',
          priceVnd: item.priceVnd || 0,
          hash: item.fingerprintHash || 'N/A',
          rawText: (item.rawRef as string) || item.address || '',
        });
      });
    }

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
            Không có bản ghi nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    const formatVnd = (val: number) =>
      val > 0
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
        : 'Liên hệ';

    rows.forEach((r, idx) => {
      const isNew = r.statusType === 'NEW';
      const badge = isNew
        ? `<span class="badge-new">CHƯA TỒN TẠI (MỚI)</span>`
        : `<span class="badge-matched">ĐÃ TỒN TẠI</span>`;

      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${badge}</td>
        <td style="font-weight: 700; color: #f1f5f9;">${r.district}</td>
        <td style="color: #cbd5e1; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.address}">${r.address}</td>
        <td style="color: #cbd5e1;">${r.roomType}</td>
        <td style="text-align: right; font-weight: 700; color: #60a5fa;">${formatVnd(r.priceVnd)}</td>
        <td style="text-align: center; font-size: 10px; color: #64748b; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.hash}">${r.hash}</td>
        <td style="text-align: center;">
          <button data-row-index="${idx}" class="reconcile-btn-secondary btn-copy-row" style="padding: 3px 8px; font-size: 10px;" title="Copy bài đăng thô">
            📋 Copy Raw
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach row copy handlers
    tbody.querySelectorAll('.btn-copy-row').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-row-index');
        if (idxStr !== null) {
          const idx = parseInt(idxStr, 10);
          const rowData = rows[idx];
          if (rowData) {
            navigator.clipboard.writeText(rowData.rawText || rowData.address);
            alert(`📋 Đã copy bài đăng thô:\n${rowData.rawText || rowData.address}`);
          }
        }
      });
    });
  }
}
