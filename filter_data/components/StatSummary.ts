import { listingRepository, type DistrictStat } from '../Data/Database/repository';
import { ListingCard } from './ListingCard';

export class StatSummary {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async update(): Promise<void> {
    try {
      const totalCount = await listingRepository.count();
      const stats: DistrictStat[] = await listingRepository.getDistrictStats();

      if (totalCount === 0) {
        this.container.innerHTML = `
          <div class="stat-summary-box stat-summary-empty">
            <span class="stat-icon">ℹ️</span>
            <span>Chưa có dữ liệu phòng trọ trong Database IndexedDB.</span>
          </div>
        `;
        return;
      }

      const topStats = stats.slice(0, 5);

      this.container.innerHTML = `
        <div class="stat-summary-box">
          <div class="stat-header">
            <div class="stat-total">
              <span class="stat-total-label">Tổng bài chuẩn hóa:</span>
              <strong class="stat-total-val">${totalCount.toLocaleString()} phòng</strong>
            </div>
            <span class="stat-badge">Dexie IndexedDB</span>
          </div>

          <div class="stat-bars">
            ${topStats
              .map((st) => {
                const percentage = Math.round((st.totalListings / totalCount) * 100);
                return `
                <div class="stat-bar-item" title="${st.district}: ${st.totalListings} phòng (Giá TB: ${ListingCard.formatPriceVnd(st.avgPriceVnd)})">
                  <div class="stat-bar-label">
                    <span>${st.district}</span>
                    <strong>${st.totalListings} phòng (${ListingCard.formatPriceVnd(st.avgPriceVnd)})</strong>
                  </div>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${Math.max(percentage, 5)}%"></div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      `;
    } catch (err: any) {
      this.container.innerHTML = `<div class="stat-summary-error">Lỗi load thống kê: ${err.message || 'Unknown error'}</div>`;
    }
  }
}
