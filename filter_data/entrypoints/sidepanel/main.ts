import './style.css';
import { listingRepository, type ListingFilterQuery } from '../../Data/Database/repository';
import type { CleanListingRecord } from '../../utils/data-cleaner/types';
import { cleanRawText } from '../../utils/data-cleaner';
import { reconciliationEngine } from '../../utils/reconciliation-engine';
import { SearchBar } from '../../components/SearchBar';
import { FilterPanel } from '../../components/FilterPanel';
import { VirtualList } from '../../components/VirtualList';
import { StatSummary } from '../../components/StatSummary';
import { DetailModal } from '../../components/DetailModal';

// Controller điều phối cho Chrome Side Panel Entrypoint
class SidePanelController {
  private filterQuery: ListingFilterQuery = {};
  private searchKeyword = '';
  private isImportExpanded = true;
  private activePendingSubTab: 'pending' | 'matched' = 'pending';
  private lastReconcileStats: {
    totalInputRows: number;
    newPendingCount: number;
    existingMatchedList: CleanListingRecord[];
  } | null = null;

  private searchBar!: SearchBar;
  private filterPanel!: FilterPanel;
  private virtualList!: VirtualList;
  private statSummary!: StatSummary;

  private resultsCountEl: HTMLElement | null = null;
  private statusBarEl: HTMLElement | null = null;
  private pendingBadgeEl: HTMLElement | null = null;
  private activeTab: 'search' | 'pending' = 'search';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.resultsCountEl = document.querySelector('#results-count');
    this.statusBarEl = document.querySelector('#status-bar');
    this.pendingBadgeEl = document.querySelector('#sp-badge-pending-count');

    // 1. Gắn Button & Navigation Tab Listeners ĐỒNG BỘ ĐẦU TIÊN
    const btnOpenDashboard = document.querySelector('#btn-open-dashboard');
    btnOpenDashboard?.addEventListener('click', () => {
      browser.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    });

    const btnRefresh = document.querySelector('#btn-refresh');
    btnRefresh?.addEventListener('click', async () => {
      await listingRepository.reseed();
      await this.statSummary?.update();
      await this.loadData();
      await this.updatePendingMerges();
    });

    this.bindSidepanelTabs();

    // 2. Stat Summary
    const statContainer = document.querySelector<HTMLElement>('#stat-summary-container');
    if (statContainer) {
      this.statSummary = new StatSummary(statContainer);
    }

    // 3. Search Bar
    const searchContainer = document.querySelector<HTMLElement>('#search-bar-container');
    if (searchContainer) {
      this.searchBar = new SearchBar(searchContainer, (kw) => {
        this.searchKeyword = kw;
        this.loadData();
      });
    }

    // 4. Filter Panel Component
    const filterContainer = document.querySelector<HTMLElement>('#filter-panel-container');
    if (filterContainer) {
      this.filterPanel = new FilterPanel(filterContainer, {
        compact: true,
        onFilterChange: (query) => {
          this.filterQuery = query;
          this.loadData();
        },
      });
    }

    // 5. Virtual List Component
    const listContainer = document.querySelector<HTMLElement>('#virtual-list-container');
    if (listContainer) {
      this.virtualList = new VirtualList(listContainer, {
        compact: true,
        callbacks: {
          onFillData: (record) => this.handleFillData(record),
          onViewDetail: (record) => DetailModal.show(record),
          onCopyText: (record) => this.updateStatus(`📋 Đã copy bài đăng thô: ${record.address}`),
        },
      });
    }

    // 6. Nạp dữ liệu vào IndexedDB và cập nhật UI song song
    this.updateStatus('Đang khởi tạo cơ sở dữ liệu...');
    await listingRepository.ensureSeeded();

    await Promise.all([
      this.statSummary?.update(),
      this.loadData(),
      this.updatePendingMerges(),
    ]);
  }

  private bindSidepanelTabs(): void {
    const tabSearch = document.querySelector('#sp-tab-search') as HTMLButtonElement;
    const tabPending = document.querySelector('#sp-tab-pending') as HTMLButtonElement;

    const statSection = document.querySelector<HTMLElement>('#stat-summary-container');
    const searchSection = document.querySelector<HTMLElement>('#search-bar-container');
    const filterSection = document.querySelector<HTMLElement>('#filter-panel-container');
    const resultsHeader = document.querySelector<HTMLElement>('#results-header-box');
    const listSection = document.querySelector<HTMLElement>('#virtual-list-container');
    const pendingSection = document.querySelector<HTMLElement>('#sp-pending-container');

    tabSearch?.addEventListener('click', () => {
      this.activeTab = 'search';
      tabSearch.style.background = '#3b82f6';
      tabSearch.style.color = '#ffffff';
      tabPending.style.background = 'transparent';
      tabPending.style.color = '#94a3b8';

      if (statSection) statSection.style.display = 'block';
      if (searchSection) searchSection.style.display = 'block';
      if (filterSection) filterSection.style.display = 'block';
      if (resultsHeader) resultsHeader.style.display = 'flex';
      if (listSection) listSection.style.display = 'block';
      if (pendingSection) pendingSection.style.display = 'none';

      this.loadData();
    });

    tabPending?.addEventListener('click', async () => {
      this.activeTab = 'pending';
      tabPending.style.background = '#f59e0b';
      tabPending.style.color = '#0f172a';
      tabSearch.style.background = 'transparent';
      tabSearch.style.color = '#94a3b8';

      if (statSection) statSection.style.display = 'none';
      if (searchSection) searchSection.style.display = 'none';
      if (filterSection) filterSection.style.display = 'none';
      if (resultsHeader) resultsHeader.style.display = 'none';
      if (listSection) listSection.style.display = 'none';
      if (pendingSection) pendingSection.style.display = 'block';

      await this.updatePendingMerges();
    });
  }

  private async updatePendingMerges(): Promise<void> {
    const pendingList = await listingRepository.getPendingMerges();
    const checkpoint = await listingRepository.getImportCheckpoint();
    const matchedList = this.lastReconcileStats ? this.lastReconcileStats.existingMatchedList : [];

    if (this.pendingBadgeEl) {
      this.pendingBadgeEl.textContent = String(pendingList.length);
      this.pendingBadgeEl.style.display = pendingList.length > 0 ? 'inline-block' : 'none';
    }

    const pendingSection = document.querySelector<HTMLElement>('#sp-pending-container');
    if (!pendingSection) return;

    const formatVnd = (val?: number) =>
      val && val > 0
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
        : 'Liên hệ';

    let html = `
      <!-- Import Raw Data Box -->
      <div style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 700; color: #60a5fa; display: flex; align-items: center; gap: 4px;">
            <span>📥</span> Nạp / Đối Chiếu Data Raw
          </span>
          <button id="sp-btn-toggle-import" style="background: transparent; border: none; color: #94a3b8; font-size: 10px; cursor: pointer;">
            ${this.isImportExpanded ? 'Thu gọn ▲' : 'Mở rộng ▼'}
          </button>
        </div>
        
        <div id="sp-import-body" style="display: ${this.isImportExpanded ? 'flex' : 'none'}; flex-direction: column; gap: 8px;">
          <textarea id="sp-raw-input" placeholder="Dán văn bản tin bài thô tại đây (Ví dụ: Cho thuê phòng Nam Từ Liêm 3.5tr full đồ...)..." style="width: 100%; height: 60px; background: rgba(15,23,42,0.8); border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 10.5px; padding: 6px; resize: vertical; font-family: inherit;"></textarea>
          
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <input type="file" id="sp-file-input" accept=".json,.csv,.txt" style="display: none;" />
            <button id="sp-btn-file" style="padding: 4px 8px; font-size: 10px; background: rgba(51, 65, 85, 0.8); color: #cbd5e1; border: 1px solid #475569; border-radius: 4px; cursor: pointer;">
              📁 Chọn File
            </button>
            <button id="sp-btn-run-reconcile" style="padding: 4px 10px; font-size: 10px; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <span>⚡</span> Bắt Đầu Đối Chiếu
            </button>
          </div>
        </div>
      </div>

      ${
        this.lastReconcileStats
          ? `<div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; font-size: 10.5px; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #94a3b8;">📊 Lượt đối chiếu gần nhất:</span>
              <div style="display: flex; gap: 8px; font-weight: 600;">
                <span style="color: #60a5fa;">Tổng: ${this.lastReconcileStats.totalInputRows}</span>
                <span style="color: #fbbf24;">Mới: ${this.lastReconcileStats.newPendingCount}</span>
                <span style="color: #c084fc;">Trùng lặp: ${matchedList.length}</span>
              </div>
             </div>`
          : ''
      }

      <!-- Sub-Tab Header for Pending vs Matched (Duplicates) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(51, 65, 85, 0.8);">
        <div style="display: flex; gap: 4px;">
          <button id="sp-subtab-pending" style="padding: 3px 7px; font-size: 10.5px; font-weight: 700; border-radius: 4px; border: 1px solid ${this.activePendingSubTab === 'pending' ? '#f59e0b' : 'transparent'}; background: ${this.activePendingSubTab === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'transparent'}; color: ${this.activePendingSubTab === 'pending' ? '#fbbf24' : '#94a3b8'}; cursor: pointer;">
            ⏳ Tin Mới (${pendingList.length})
          </button>
          <button id="sp-subtab-matched" style="padding: 3px 7px; font-size: 10.5px; font-weight: 700; border-radius: 4px; border: 1px solid ${this.activePendingSubTab === 'matched' ? '#a855f7' : 'transparent'}; background: ${this.activePendingSubTab === 'matched' ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}; color: ${this.activePendingSubTab === 'matched' ? '#c084fc' : '#94a3b8'}; cursor: pointer;" title="Xem các phòng trùng lặp đã bị bỏ qua">
            ⏭️ Trùng Lặp (${matchedList.length})
          </button>
        </div>

        ${
          this.activePendingSubTab === 'pending'
            ? `<div style="display: flex; gap: 4px;">
                <button id="sp-btn-accept-all" ${pendingList.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;' : ''} style="padding: 3px 6px; font-size: 10px; font-weight: 700; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  ✓ Accept Hết
                </button>
                <button id="sp-btn-reject-all" ${pendingList.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;' : ''} style="padding: 3px 6px; font-size: 10px; font-weight: 700; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; cursor: pointer;" title="Reject và xóa danh sách chờ để import lại từ đầu">
                  🚫 Reject Hết
                </button>
               </div>`
            : ''
        }
      </div>

      ${
        checkpoint && this.activePendingSubTab === 'pending'
          ? `<div style="margin-bottom: 10px; padding: 6px 8px; background: rgba(15,23,42,0.8); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; font-size: 11px; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
              <div>📍 <b>Mốc Import Cuối:</b> <span style="color: #fbbf24;">${checkpoint.lastLocationName}</span></div>
              <button id="sp-btn-reset-cp" style="padding: 2px 5px; font-size: 9px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 3px; cursor: pointer;" title="Reset mốc import để nạp lại từ đầu">Reset Mốc</button>
             </div>`
          : ''
      }
    `;

    if (this.activePendingSubTab === 'pending') {
      if (pendingList.length === 0) {
        html += `
          <div style="text-align: center; padding: 20px 12px; color: #94a3b8; font-size: 12px; background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px dashed rgba(51, 65, 85, 0.8);">
            <div style="font-size: 24px; margin-bottom: 6px;">🎉</div>
            Không có tin địa điểm/phòng mới nào chờ duyệt.<br>Tất cả dữ liệu đã được đồng bộ với DB.
          </div>
        `;
      } else {
        html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        pendingList.forEach((item) => {
          html += `
            <div style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(51, 65, 85, 0.9); border-radius: 8px; padding: 10px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #38bdf8;">${item.district || 'Khác'}</span>
                <span style="font-weight: 700; color: #34d399;">${formatVnd(item.priceVnd)}</span>
              </div>
              <div style="color: #f1f5f9; font-weight: 600; margin-bottom: 4px; line-height: 1.3;">
                ${item.address || 'Chưa rõ địa chỉ'}
              </div>
              <div style="color: #94a3b8; font-size: 10px; margin-bottom: 8px;">
                Loại phòng: ${item.roomType || 'N/A'} • Nguồn: ${item.batchId || 'Import'}
              </div>
              <div style="display: flex; gap: 6px;">
                <button data-accept-id="${item.id}" style="flex: 1; padding: 4px; font-size: 10px; font-weight: 700; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  ✓ Accept Merge
                </button>
                <button data-copy-id="${item.id}" style="padding: 4px 6px; font-size: 10px; font-weight: 600; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 4px; cursor: pointer;" title="Copy bài đăng thô chưa merge">
                  📋 Copy Raw
                </button>
                <button data-reject-id="${item.id}" style="padding: 4px 8px; font-size: 10px; font-weight: 600; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; cursor: pointer;" title="Reject & Xóa để cho phép Import lại">
                  🚫 Reject
                </button>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }
    } else {
      // Subtab: Matched (Duplicates)
      if (matchedList.length === 0) {
        html += `
          <div style="text-align: center; padding: 20px 12px; color: #94a3b8; font-size: 12px; background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px dashed rgba(51, 65, 85, 0.8);">
            <div style="font-size: 20px; margin-bottom: 6px;">ℹ️</div>
            Chưa có tin trùng lặp nào bị bỏ qua trong lượt nạp vừa qua.
          </div>
        `;
      } else {
        html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        matchedList.forEach((item) => {
          html += `
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(51, 65, 85, 0.6); border-radius: 8px; padding: 8px 10px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #94a3b8;">${item.district || 'Khác'}</span>
                <span style="font-weight: 700; color: #c084fc;">${formatVnd(item.priceVnd)}</span>
              </div>
              <div style="color: #cbd5e1; font-weight: 500; margin-bottom: 4px; line-height: 1.3;">
                ${item.address || 'Chưa rõ địa chỉ'}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 10px;">
                <span>Loại phòng: ${item.roomType || 'N/A'}</span>
                <span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 600;">
                  ⏭️ Trùng Lặp DB (Bỏ Qua)
                </span>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }
    }

    pendingSection.innerHTML = html;

    // Attach Subtab Listeners
    pendingSection.querySelector('#sp-subtab-pending')?.addEventListener('click', () => {
      this.activePendingSubTab = 'pending';
      this.updatePendingMerges();
    });

    pendingSection.querySelector('#sp-subtab-matched')?.addEventListener('click', () => {
      this.activePendingSubTab = 'matched';
      this.updatePendingMerges();
    });

    // Attach Import Listeners
    pendingSection.querySelector('#sp-btn-toggle-import')?.addEventListener('click', () => {
      this.isImportExpanded = !this.isImportExpanded;
      this.updatePendingMerges();
    });

    const fileInput = pendingSection.querySelector<HTMLInputElement>('#sp-file-input');
    const btnFile = pendingSection.querySelector<HTMLButtonElement>('#sp-btn-file');
    btnFile?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const textarea = pendingSection.querySelector<HTMLTextAreaElement>('#sp-raw-input');
        if (textarea) textarea.value = text;
        this.updateStatus(`📁 Đã đọc file: ${file.name} (${file.size} bytes)`);
      } catch (err: any) {
        this.updateStatus(`❌ Lỗi đọc file: ${err.message}`, true);
      }
    });

    pendingSection.querySelector('#sp-btn-run-reconcile')?.addEventListener('click', async () => {
      const textarea = pendingSection.querySelector<HTMLTextAreaElement>('#sp-raw-input');
      const rawText = textarea?.value?.trim() || '';
      if (!rawText) {
        this.updateStatus('⚠️ Vui lòng dán văn bản tin thô hoặc chọn file để đối chiếu!', true);
        return;
      }

      this.updateStatus('⏳ Đang phân tích và làm sạch dữ liệu thô...');
      const cleaned = await cleanRawText(rawText);
      if (cleaned.length === 0) {
        this.updateStatus('⚠️ Không trích xuất được phòng trọ nào từ dữ liệu thô nhập vào!', true);
        return;
      }

      this.updateStatus(`⏳ Đang đối chiếu ${cleaned.length} tin thô với Database...`);
      const result = await reconciliationEngine.reconcile(cleaned, 'SIDEPANEL_IMPORT');

      this.lastReconcileStats = {
        totalInputRows: cleaned.length,
        newPendingCount: result.newPendingList.length,
        existingMatchedList: result.existingMatchedList,
      };

      const newCount = result.newPendingList.length;
      const matchedCount = result.existingMatchedList.length;
      this.updateStatus(`✅ Đã đối chiếu ${cleaned.length} tin: ✨ ${newCount} tin mới | ⏭️ ${matchedCount} phòng trùng lặp (đã bỏ qua)`);
      await this.updatePendingMerges();
    });

    // Attach Action Listeners
    pendingSection.querySelector('#sp-btn-accept-all')?.addEventListener('click', async () => {
      if (pendingList.length === 0) return;
      const allIds = pendingList.map((i) => i.id);
      await listingRepository.approvePendingMerges(allIds);
      this.updateStatus(`✅ Đã merge tất cả ${allIds.length} địa điểm mới vào Database chính.`);
      await this.statSummary?.update();
      await this.updatePendingMerges();
    });

    pendingSection.querySelector('#sp-btn-reject-all')?.addEventListener('click', async () => {
      if (pendingList.length === 0) return;
      const confirmReject = confirm('Bạn có chắc muốn Reject tất cả tin chờ duyệt để có thể import lại data thô?');
      if (!confirmReject) return;
      const allIds = pendingList.map((i) => i.id);
      await listingRepository.deletePendingMerges(allIds);
      this.updateStatus(`🚫 Đã reject và xóa tất cả tin chờ duyệt. Bạn có thể nạp lại data!`);
      await this.updatePendingMerges();
    });

    pendingSection.querySelector('#sp-btn-reset-cp')?.addEventListener('click', async () => {
      await listingRepository.resetImportCheckpoint();
      this.updateStatus(`🔄 Đã reset mốc điểm dừng import.`);
      await this.updatePendingMerges();
    });

    pendingSection.querySelectorAll('[data-accept-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-accept-id');
        if (id) {
          await listingRepository.approvePendingMerges([id]);
          this.updateStatus(`✅ Đã merge địa điểm mới vào Database.`);
          await this.statSummary?.update();
          await this.updatePendingMerges();
        }
      });
    });

    pendingSection.querySelectorAll('[data-copy-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-copy-id');
        const item = pendingList.find((p) => p.id === id);
        if (item) {
          const rawContent = (item.rawText as string) || (item.rawRef as string) || item.address || '';
          navigator.clipboard.writeText(rawContent);
          this.updateStatus(`📋 Đã copy bài đăng thô: ${item.address || item.district}`);
        }
      });
    });

    pendingSection.querySelectorAll('[data-reject-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-reject-id');
        if (id) {
          await listingRepository.deletePendingMerges([id]);
          this.updateStatus(`🚫 Đã Reject & xóa bản ghi để cho phép import lại.`);
          await this.updatePendingMerges();
        }
      });
    });
  }

  private async loadData(): Promise<void> {
    try {
      this.updateStatus('Đang truy vấn dữ liệu IndexedDB...');

      const queryParams: ListingFilterQuery = {
        ...this.filterQuery,
        searchKeyword: this.searchKeyword || undefined,
        limit: 500, // Side panel mở rộng 500 kết quả
        offset: 0,
      };

      const { items, total } = await listingRepository.queryListings(queryParams);

      this.virtualList.setItems(items);

      if (this.resultsCountEl) {
        this.resultsCountEl.textContent = `Hiển thị ${items.length}/${total} phòng`;
      }

      this.updateStatus(`Đã tải ${items.length} phòng trọ trùng khớp.`);
    } catch (err: any) {
      this.updateStatus(`Lỗi truy vấn: ${err.message || 'Unknown error'}`, true);
    }
  }

  private async handleFillData(record: CleanListingRecord): Promise<void> {
    this.updateStatus(`Đang gửi dữ liệu phòng ${record.address}...`);

    try {
      const response = await browser.runtime.sendMessage({
        action: 'FILL_LISTING_DATA',
        payload: record,
      });

      if (response?.status === 'SUCCESS') {
        this.updateStatus(`✅ ${response.res?.status || 'Đã điền dữ liệu thành công'}`);
      } else {
        this.updateStatus(`❌ Lỗi: ${response?.message || 'Không điền được data'}`, true);
      }
    } catch (err: any) {
      this.updateStatus(`❌ Lỗi: ${err.message || 'Không kết nối được active tab'}`, true);
    }
  }

  private updateStatus(msg: string, isError = false): void {
    if (!this.statusBarEl) return;
    this.statusBarEl.textContent = msg;
    this.statusBarEl.style.color = isError ? '#f87171' : '#cbd5e1';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanelController();
});
