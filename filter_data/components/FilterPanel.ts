import type { ListingFilterQuery } from '../Data/Database/repository';

export interface FilterPanelOptions {
  onFilterChange: (query: ListingFilterQuery) => void;
  compact?: boolean;
}

const DISTRICT_LIST = [
  'Hai Bà Trưng',
  'Nam Từ Liêm',
  'Thanh Xuân',
  'Cầu Giấy',
  'Hà Đông',
  'Tây Hồ',
  'Ba Đình',
  'Bắc Từ Liêm',
  'Đống Đa',
  'Hoài Đức',
  'Hoàng Mai',
  'Long Biên',
];

const ROOM_TYPES = [
  { value: 'Studio', label: 'Studio' },
  { value: '1N1K', label: '1N1K (1PN1K)' },
  { value: '2N1K', label: '2N1K (2PN1K)' },
  { value: '3N1K', label: '3N1K (3PN1K)' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Gác xép', label: 'Gác xép' },
  { value: 'CCMN', label: 'CCMN' },
  { value: 'Phòng Trọ', label: 'Phòng Trọ' },
];

export class FilterPanel {
  private container: HTMLElement;
  private options: FilterPanelOptions;
  private currentFilter: ListingFilterQuery = {};

  constructor(container: HTMLElement, options: FilterPanelOptions) {
    this.container = container;
    this.options = options;
    this.render();
  }

  private render(): void {
    const compactClass = this.options.compact ? 'filter-panel-compact' : '';

    this.container.innerHTML = `
      <div class="filter-panel ${compactClass}">
        <div class="filter-row filter-row-primary">
          <!-- Dropdown Quận -->
          <div class="filter-group">
            <label for="filter-district">📍 Quận/Huyện:</label>
            <select id="filter-district" class="filter-select">
              <option value="">-- Tất cả Quận --</option>
              ${DISTRICT_LIST.map(
                (d) => `<option value="${d}">${d}</option>`
              ).join('')}
            </select>
          </div>

          <!-- Dropdown Loại Phòng -->
          <div class="filter-group">
            <label for="filter-room-type">🏠 Loại Phòng:</label>
            <select id="filter-room-type" class="filter-select">
              <option value="">-- Tất cả Loại --</option>
              ${ROOM_TYPES.map(
                (rt) => `<option value="${rt.value}">${rt.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="filter-row filter-row-secondary">
          <!-- Khoảng Giá VND -->
          <div class="filter-group filter-group-price">
            <label>💵 Khoảng Giá (Triệu/tháng):</label>
            <div class="price-inputs">
              <input type="number" id="filter-min-price" class="filter-input-price" placeholder="Min" step="0.5" min="0" />
              <span>-</span>
              <input type="number" id="filter-max-price" class="filter-input-price" placeholder="Max" step="0.5" min="0" />
            </div>
          </div>

          <!-- Checkbox Chính Sách -->
          <div class="filter-group filter-group-checkboxes">
            <label class="checkbox-label" title="Cho phép nuôi thú cưng">
              <input type="checkbox" id="filter-pet" />
              <span>🐶 Pet</span>
            </label>

            <label class="checkbox-label" title="Cho phép sạc/để xe điện">
              <input type="checkbox" id="filter-ev" />
              <span>⚡ Xe Điện</span>
            </label>
          </div>

          <!-- Reset Button -->
          <button id="filter-reset-btn" class="btn btn-sm btn-ghost" title="Đặt lại bộ lọc">
            🔄 Đặt lại
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const districtEl = this.container.querySelector<HTMLSelectElement>('#filter-district');
    const roomTypeEl = this.container.querySelector<HTMLSelectElement>('#filter-room-type');
    const minPriceEl = this.container.querySelector<HTMLInputElement>('#filter-min-price');
    const maxPriceEl = this.container.querySelector<HTMLInputElement>('#filter-max-price');
    const petEl = this.container.querySelector<HTMLInputElement>('#filter-pet');
    const evEl = this.container.querySelector<HTMLInputElement>('#filter-ev');
    const resetBtn = this.container.querySelector<HTMLButtonElement>('#filter-reset-btn');

    const updateFilter = () => {
      const district = districtEl?.value || undefined;
      const roomType = roomTypeEl?.value || undefined;
      const minPriceMillion = minPriceEl?.value ? parseFloat(minPriceEl.value) : undefined;
      const maxPriceMillion = maxPriceEl?.value ? parseFloat(maxPriceEl.value) : undefined;
      const allowPet = petEl?.checked ? true : undefined;
      const allowEV = evEl?.checked ? true : undefined;

      this.currentFilter = {
        district,
        roomType,
        minPriceVnd: minPriceMillion ? Math.round(minPriceMillion * 1_000_000) : undefined,
        maxPriceVnd: maxPriceMillion ? Math.round(maxPriceMillion * 1_000_000) : undefined,
        allowPet,
        allowEV,
      };

      this.options.onFilterChange(this.currentFilter);
    };

    districtEl?.addEventListener('change', updateFilter);
    roomTypeEl?.addEventListener('change', updateFilter);
    minPriceEl?.addEventListener('input', updateFilter);
    maxPriceEl?.addEventListener('input', updateFilter);
    petEl?.addEventListener('change', updateFilter);
    evEl?.addEventListener('change', updateFilter);

    resetBtn?.addEventListener('click', () => {
      if (districtEl) districtEl.value = '';
      if (roomTypeEl) roomTypeEl.value = '';
      if (minPriceEl) minPriceEl.value = '';
      if (maxPriceEl) maxPriceEl.value = '';
      if (petEl) petEl.checked = false;
      if (evEl) evEl.checked = false;

      this.currentFilter = {};
      this.options.onFilterChange(this.currentFilter);
    });
  }

  public getFilter(): ListingFilterQuery {
    return this.currentFilter;
  }
}
