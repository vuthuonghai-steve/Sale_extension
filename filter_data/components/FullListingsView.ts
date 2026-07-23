import { listingRepository } from '../Data/Database/repository';
import type { CleanListingRecord } from '../utils/data-cleaner/types';

export class FullListingsView {
  private container: HTMLElement;
  private pendingListings: CleanListingRecord[] = [];
  private selectedIds: Set<string> = new Set();
  private onListUpdated?: () => void;

  constructor(container: HTMLElement, options?: { onListUpdated?: () => void }) {
    this.container = container;
    this.onListUpdated = options?.onListUpdated;
    this.init();
  }

  private async init(): Promise<void> {
    await this.refresh();
  }

  public async refresh(): Promise<void> {
    this.pendingListings = await listingRepository.getPendingFullListings();
    this.selectedIds = new Set(this.pendingListings.map((item) => item.id));
    this.render();
  }

  private render(): void {
    const total = this.pendingListings.length;

    if (total === 0) {
      this.container.innerHTML = `
        <div class="full-queue-empty">
          <div class="empty-icon-circle">
            ✨
          </div>
          <h3 class="empty-title">Không có phòng hết cần xử lý</h3>
          <p class="empty-desc">
            Tất cả các địa điểm báo FULL / Hết phòng đã được đồng bộ lên kênh bên thứ 3 hoặc không có trong dữ liệu thô.
          </p>
        </div>
      `;
      return;
    }

    const isAllSelected = this.selectedIds.size === total && total > 0;
    const selectedCount = this.selectedIds.size;

    this.container.innerHTML = `
      <div class="full-queue-wrapper">
        <!-- Banner Header -->
        <div class="full-queue-header">
          <div class="full-queue-header-bg-glow"></div>
          
          <div class="full-queue-header-content">
            <div class="full-queue-header-info">
              <div class="full-queue-header-icon">
                🚫
              </div>
              <div class="full-queue-header-text">
                <div class="full-queue-title-row">
                  <h3 class="full-queue-title">
                    Danh sách Phòng / Địa điểm Hết (FULL Queue)
                  </h3>
                  <span class="full-queue-badge-count">
                    ${total} tin
                  </span>
                </div>
                <p class="full-queue-subtitle">
                  Các bài đăng bên dưới đã ghi nhận trạng thái hết phòng. Hãy sao chép để gửi nhóm/kênh chung 3rd party, sau đó đánh dấu xác nhận để làm sạch danh sách.
                </p>
              </div>
            </div>

            <!-- Action Buttons Group -->
            <div class="full-queue-actions">
              <button id="btn-copy-full-text" class="full-queue-btn full-queue-btn-copy">
                <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                <span>Copy gửi 3rd Party</span>
                <span class="full-queue-badge-selected">${selectedCount}</span>
              </button>

              <button id="btn-mark-full-synced" class="full-queue-btn full-queue-btn-sync">
                <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Đã cập nhật kênh 3rd Party</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Control Bar (Select all & Summary) -->
        <div class="full-queue-control-bar">
          <label class="full-queue-select-all">
            <input type="checkbox" id="chk-select-all-full" ${isAllSelected ? 'checked' : ''} class="full-queue-checkbox" />
            <span>Chọn tất cả (<strong class="highlight-count">${selectedCount}</strong>/${total})</span>
          </label>

          <div class="full-queue-indicator">
            <span class="indicator-dot"></span>
            <span>Định dạng tự động chuẩn hóa sẵn sàng dán</span>
          </div>
        </div>

        <!-- Card Grid List -->
        <div class="full-queue-grid">
          ${this.pendingListings
            .map((item) => {
              const isChecked = this.selectedIds.has(item.id);
              const address = item.address || 'Chưa rõ địa chỉ';
              const district = item.district ? `[${item.district}] ` : '';
              const rawRef = item.rawRef || address;

              return `
                <div class="full-queue-item ${isChecked ? 'selected' : ''}">
                  <div class="item-checkbox-wrapper">
                    <input type="checkbox" data-id="${item.id}" class="chk-full-item full-queue-checkbox" ${isChecked ? 'checked' : ''} />
                  </div>

                  <div class="item-content">
                    <div class="item-header">
                      <span class="badge-full-tag">
                        FULL P
                      </span>
                      <span class="item-address" title="${district}${address}">
                        <strong class="item-district">${district}</strong>${address}
                      </span>
                    </div>

                    <div class="item-raw-ref">${this.escapeHtml(rawRef)}</div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Select all checkbox
    const chkSelectAll = this.container.querySelector<HTMLInputElement>('#chk-select-all-full');
    chkSelectAll?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) {
        this.selectedIds = new Set(this.pendingListings.map((item) => item.id));
      } else {
        this.selectedIds.clear();
      }
      this.render();
    });

    // Individual item checkboxes
    const itemCheckboxes = this.container.querySelectorAll<HTMLInputElement>('.chk-full-item');
    itemCheckboxes.forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const id = target.dataset.id;
        if (!id) return;

        if (target.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        this.render();
      });
    });

    // Copy full text button
    const btnCopy = this.container.querySelector('#btn-copy-full-text');
    btnCopy?.addEventListener('click', () => this.copySelectedText());

    // Mark as synced button
    const btnSync = this.container.querySelector('#btn-mark-full-synced');
    btnSync?.addEventListener('click', () => this.markSynced());
  }

  private copySelectedText(): void {
    const selectedListings = this.pendingListings.filter((item) => this.selectedIds.has(item.id));
    if (selectedListings.length === 0) {
      alert('Vui lòng chọn ít nhất 1 phòng hết để copy.');
      return;
    }

    const lines = selectedListings.map((item) => {
      const address = item.address || item.rawRef || 'Địa điểm hết phòng';
      return `❌ FULL P: ${address}`;
    });

    const fullText = `=== DANH SÁCH PHÒNG ĐÃ FULL (${selectedListings.length}) ===\n` + lines.join('\n');

    navigator.clipboard.writeText(fullText).then(
      () => alert(`✅ Đã copy ${selectedListings.length} phòng hết vào bộ nhớ tạm!`),
      () => alert('❌ Không thể truy cập bộ nhớ tạm (clipboard).')
    );
  }

  private async markSynced(): Promise<void> {
    const selectedListings = this.pendingListings.filter((item) => this.selectedIds.has(item.id));
    if (selectedListings.length === 0) {
      alert('Vui lòng chọn ít nhất 1 phòng hết để đánh dấu đã cập nhật.');
      return;
    }

    const confirmMsg = `Xác nhận bạn đã đăng/cập nhật ${selectedListings.length} địa điểm này lên kênh bên thứ 3?\nDữ liệu này sẽ được gỡ khỏi danh sách phòng hết chờ xử lý.`;
    if (!confirm(confirmMsg)) return;

    const ids = selectedListings.map((item) => item.id);
    const count = await listingRepository.markFullListingsSynced(ids, true);

    alert(`✅ Đã gỡ bỏ ${count} địa điểm hết phòng khỏi danh sách chờ.`);
    await this.refresh();
    if (this.onListUpdated) {
      this.onListUpdated();
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
