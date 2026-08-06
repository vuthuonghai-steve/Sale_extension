import './style.css';
import { listingRepository, type ListingFilterQuery } from '../../Data/Database/repository';
import type { CleanListingRecord } from '../../utils/data-cleaner/types';
import { SearchBar } from '../../components/SearchBar';
import { FilterPanel } from '../../components/FilterPanel';
import { VirtualList } from '../../components/VirtualList';
import { StatSummary } from '../../components/StatSummary';
import { DetailModal } from '../../components/DetailModal';
import { FullListingsView } from '../../components/FullListingsView';
import { ReconciliationView } from '../../components/ReconciliationView';

class DashboardController {
  private filterQuery: ListingFilterQuery = {};
  private searchKeyword = '';

  private searchBar!: SearchBar;
  private filterPanel!: FilterPanel;
  private virtualList!: VirtualList;
  private statSummary!: StatSummary;
  private fullListingsView!: FullListingsView;
  private reconciliationView!: ReconciliationView;

  private totalCountEl: HTMLElement | null = null;
  private badgeFullCountEl: HTMLElement | null = null;
  private currentItems: CleanListingRecord[] = [];
  private activeTab: 'available' | 'full' | 'reconcile' = 'available';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.totalCountEl = document.querySelector('#dashboard-total-count');
    this.badgeFullCountEl = document.querySelector('#badge-full-count');

    // 1. Gắn Navigation Tabs & Button Listeners NGAY LẬP TỨC để DOM phản hồi bấm nút 100%
    this.bindNavigationTabs();

    const btnImportData = document.querySelector('#btn-import-data');
    btnImportData?.addEventListener('click', () => {
      const tabReconcile = document.querySelector('#tab-reconcile') as HTMLElement;
      tabReconcile?.click();
    });

    const btnRefresh = document.querySelector('#btn-refresh');
    btnRefresh?.addEventListener('click', async () => {
      await listingRepository.reseed();
      await this.statSummary?.update();
      await this.fullListingsView?.refresh();
      await this.updateFullBadge();
      await this.loadData();
    });

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

    // 4. Filter Panel
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

    // 5. Virtual List (Phòng còn)
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

    // 6. Full Listings View (Không gian phòng FULL)
    const fullContainer = document.querySelector<HTMLElement>('#full-listings-container');
    if (fullContainer) {
      this.fullListingsView = new FullListingsView(fullContainer, {
        onListUpdated: () => {
          this.updateFullBadge();
          this.loadData();
          this.statSummary?.update();
        },
      });
    }

    // 7. Reconciliation View (Đối chiếu Data Thô & Import)
    const reconcileContainer = document.querySelector<HTMLElement>('#reconciliation-container');
    if (reconcileContainer) {
      this.reconciliationView = new ReconciliationView(reconcileContainer);
    }

    // 8. Tự động nạp dữ liệu mốc và cập nhật UI song song
    await listingRepository.ensureSeeded();
    await Promise.all([
      this.statSummary?.update(),
      this.reconciliationView?.render(),
      this.updateFullBadge(),
      this.loadData(),
    ]);
  }

  private bindNavigationTabs(): void {
    const tabAvailable = document.querySelector('#tab-available');
    const tabReconcile = document.querySelector('#tab-reconcile');
    const tabFull = document.querySelector('#tab-full-queue');

    const filterSection = document.querySelector<HTMLElement>('#filter-panel-container');
    const listSection = document.querySelector<HTMLElement>('#virtual-list-container');
    const reconcileSection = document.querySelector<HTMLElement>('#reconciliation-container');
    const fullSection = document.querySelector<HTMLElement>('#full-listings-container');

    tabAvailable?.addEventListener('click', (e) => {
      e.preventDefault();
      this.activeTab = 'available';
      tabAvailable.classList.add('active');
      tabReconcile?.classList.remove('active');
      tabFull?.classList.remove('active');

      if (filterSection) filterSection.style.display = 'block';
      if (listSection) listSection.style.display = 'block';
      if (reconcileSection) reconcileSection.style.display = 'none';
      if (fullSection) fullSection.style.display = 'none';

      this.loadData();
    });

    tabReconcile?.addEventListener('click', (e) => {
      e.preventDefault();
      this.activeTab = 'reconcile';
      tabReconcile.classList.add('active');
      tabAvailable?.classList.remove('active');
      tabFull?.classList.remove('active');

      if (filterSection) filterSection.style.display = 'none';
      if (listSection) listSection.style.display = 'none';
      if (reconcileSection) reconcileSection.style.display = 'block';
      if (fullSection) fullSection.style.display = 'none';

      this.reconciliationView?.render();
    });

    tabFull?.addEventListener('click', (e) => {
      e.preventDefault();
      this.activeTab = 'full';
      tabFull.classList.add('active');
      tabAvailable?.classList.remove('active');
      tabReconcile?.classList.remove('active');

      if (filterSection) filterSection.style.display = 'none';
      if (listSection) listSection.style.display = 'none';
      if (reconcileSection) reconcileSection.style.display = 'none';
      if (fullSection) fullSection.style.display = 'block';

      this.fullListingsView?.refresh();
    });
  }

  private async updateFullBadge(): Promise<void> {
    const pendingFull = await listingRepository.getPendingFullListings();
    const count = pendingFull.length;
    if (this.badgeFullCountEl) {
      this.badgeFullCountEl.textContent = String(count);
      if (count > 0) {
        this.badgeFullCountEl.classList.remove('hidden');
      } else {
        this.badgeFullCountEl.classList.add('hidden');
      }
    }
  }

  private async loadData(): Promise<void> {
    try {
      const queryParams: ListingFilterQuery = {
        ...this.filterQuery,
        searchKeyword: this.searchKeyword || undefined,
        isFull: false, // Chỉ nạp phòng còn khả dụng trong tab tra cứu chính
        limit: 5000,
        offset: 0,
      };

      const { items, total } = await listingRepository.queryListings(queryParams);
      this.currentItems = items;

      this.virtualList.setItems(items);

      if (this.totalCountEl) {
        this.totalCountEl.textContent = `Tổng bản ghi khả dụng: ${total.toLocaleString()} phòng`;
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
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardController();
});
