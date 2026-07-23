import './style.css';
import { listingRepository, type ListingFilterQuery } from '../../Data/Database/repository';
import type { CleanListingRecord } from '../../utils/data-cleaner/types';
import { SearchBar } from '../../components/SearchBar';
import { FilterPanel } from '../../components/FilterPanel';
import { VirtualList } from '../../components/VirtualList';
import { StatSummary } from '../../components/StatSummary';
import { DetailModal } from '../../components/DetailModal';

class DashboardController {
  private filterQuery: ListingFilterQuery = {};
  private searchKeyword = '';

  private searchBar!: SearchBar;
  private filterPanel!: FilterPanel;
  private virtualList!: VirtualList;
  private statSummary!: StatSummary;

  private totalCountEl: HTMLElement | null = null;
  private currentItems: CleanListingRecord[] = [];

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.totalCountEl = document.querySelector('#dashboard-total-count');

    // 0. Tự động nạp dữ liệu mẫu từ snapshot nếu Database trống
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

    // 3. Filter Panel
    const filterContainer = document.querySelector<HTMLElement>('#filter-panel-container');
    if (filterContainer) {
      this.filterPanel = new FilterPanel(filterContainer, {
        compact: false,
        onFilterChange: (query) => {
          this.filterQuery = query;
          this.loadData();
        },
      });
    }

    // 4. Virtual List
    const listContainer = document.querySelector<HTMLElement>('#virtual-list-container');
    if (listContainer) {
      this.virtualList = new VirtualList(listContainer, {
        compact: false,
        callbacks: {
          onFillData: (record) => this.handleFillData(record),
          onViewDetail: (record) => DetailModal.show(record),
          onCopyText: (record) => alert(`Đã copy bài đăng: ${record.address}`),
        },
      });
    }

    // 5. Export JSON & Refresh
    const btnExportJson = document.querySelector('#btn-export-json');
    btnExportJson?.addEventListener('click', () => this.exportJSON());

    const btnRefresh = document.querySelector('#btn-refresh');
    btnRefresh?.addEventListener('click', async () => {
      await listingRepository.ensureSeeded();
      await this.statSummary?.update();
      await this.loadData();
    });

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const queryParams: ListingFilterQuery = {
        ...this.filterQuery,
        searchKeyword: this.searchKeyword || undefined,
        limit: 5000, // Dashboard render up to 5000 items via Virtual List
        offset: 0,
      };

      const { items, total } = await listingRepository.queryListings(queryParams);
      this.currentItems = items;

      this.virtualList.setItems(items);

      if (this.totalCountEl) {
        this.totalCountEl.textContent = `Tổng bản ghi tìm thấy: ${total.toLocaleString()} phòng`;
      }
    } catch (err: any) {
      console.error('[Dashboard] Error querying listings:', err);
    }
  }

  private async handleFillData(record: CleanListingRecord): Promise<void> {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'FILL_LISTING_DATA',
        payload: record,
      });

      if (response?.status === 'SUCCESS') {
        alert(`✅ ${response.res?.status || 'Đã gửi thông tin phòng trọ tới active tab'}`);
      } else {
        alert(`❌ Lỗi: ${response?.message || 'Không kết nối được trang active tab'}`);
      }
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message || 'Chưa mở tab web host'}`);
    }
  }

  private exportJSON(): void {
    if (this.currentItems.length === 0) {
      alert('Không có dữ liệu để export.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.currentItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `normalized_listings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardController();
});
