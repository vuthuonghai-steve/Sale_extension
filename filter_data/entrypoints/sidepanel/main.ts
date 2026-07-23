import './style.css';
import { listingRepository, type ListingFilterQuery } from '../../Data/Database/repository';
import type { CleanListingRecord } from '../../utils/data-cleaner/types';
import { SearchBar } from '../../components/SearchBar';
import { FilterPanel } from '../../components/FilterPanel';
import { VirtualList } from '../../components/VirtualList';
import { StatSummary } from '../../components/StatSummary';
import { DetailModal } from '../../components/DetailModal';

// Controller điều phối cho Chrome Side Panel Entrypoint
class SidePanelController {
  private filterQuery: ListingFilterQuery = {};
  private searchKeyword = '';

  private searchBar!: SearchBar;
  private filterPanel!: FilterPanel;
  private virtualList!: VirtualList;
  private statSummary!: StatSummary;

  private resultsCountEl: HTMLElement | null = null;
  private statusBarEl: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.resultsCountEl = document.querySelector('#results-count');
    this.statusBarEl = document.querySelector('#status-bar');

    // 0. Nạp dữ liệu vào IndexedDB nếu trống
    this.updateStatus('Đang khởi tạo cơ sở dữ liệu...');
    await listingRepository.ensureSeeded();

    // 1. Stat Summary
    const statContainer = document.querySelector<HTMLElement>('#stat-summary-container');
    if (statContainer) {
      this.statSummary = new StatSummary(statContainer);
      await this.statSummary.update();
    }

    // 2. Search Bar
    const searchContainer = document.querySelector<HTMLElement>('#search-bar-container');
    if (searchContainer) {
      this.searchBar = new SearchBar(searchContainer, (kw) => {
        this.searchKeyword = kw;
        this.loadData();
      });
    }

    // 3. Filter Panel Component
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

    // 4. Virtual List Component
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

    // 5. Button Listeners
    const btnOpenDashboard = document.querySelector('#btn-open-dashboard');
    btnOpenDashboard?.addEventListener('click', () => {
      browser.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    });

    const btnRefresh = document.querySelector('#btn-refresh');
    btnRefresh?.addEventListener('click', async () => {
      await listingRepository.ensureSeeded();
      await this.statSummary?.update();
      await this.loadData();
    });

    // Initial Data Load
    await this.loadData();
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
