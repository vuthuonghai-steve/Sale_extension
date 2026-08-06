import type { CleanListingRecord } from '../utils/data-cleaner/types';
import { ListingCard } from './ListingCard';

export class DetailModal {
  private static modalContainer: HTMLElement | null = null;

  public static show(record: CleanListingRecord): void {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔍 Chi Tiết Bản Ghi Chuẩn Hóa</h3>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-section">
            <h4>📊 Dữ Liệu Đã Chuẩn Hóa</h4>
            <table class="detail-table">
              <tr><th>ID Bản Ghi:</th><td><code>${record.id}</code></td></tr>
              <tr><th>Mã Quản Lý:</th><td>${record.managerCode || '<i>N/A</i>'}</td></tr>
              <tr><th>Địa Chỉ:</th><td><strong>${record.address}</strong></td></tr>
              <tr><th>Quận/Huyện:</th><td><span class="badge badge-district">${record.district || 'Khác'}</span></td></tr>
              <tr><th>Giá Trị VND:</th><td><strong class="text-success">${ListingCard.formatPriceVnd(record.priceVnd)}</strong> (${record.priceVnd || 0} VND)</td></tr>
              <tr><th>Giá Thô (Raw):</th><td><code>${record.priceRaw || 'N/A'}</code></td></tr>
              <tr><th>Loại Phòng:</th><td>${record.roomType || 'Phòng Trọ'}</td></tr>
              <tr><th>Chính Sách Pet:</th><td>${record.policies?.allowPet ? '🐶 Cho nuôi thú cưng' : '❌ Không/Không rõ'}</td></tr>
              <tr><th>Chính Sách Xe Điện:</th><td>${record.policies?.allowElectricVehicle ? '⚡ Cho phép xe điện' : '❌ Không/Không rõ'}</td></tr>
              <tr><th>SĐT Liên Hệ:</th><td>${record.contactPhone || 'N/A'}</td></tr>
              <tr><th>Fingerprint Hash:</th><td><code>${record.fingerprintHash || 'N/A'}</code></td></tr>
            </table>
          </div>

          <div class="modal-section">
            <h4>📜 Nội Dung Thô Gốc (Raw Ref)</h4>
            <div class="raw-content-box">
              <pre>${record.rawRef ? record.rawRef.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Không có nội dung gốc'}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary modal-close-action">Đóng</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalContainer = overlay;

    const closeBtn = overlay.querySelector('.modal-close-btn');
    const closeAction = overlay.querySelector('.modal-close-action');

    closeBtn?.addEventListener('click', () => this.close());
    closeAction?.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  }

  public static close(): void {
    if (this.modalContainer && document.body.contains(this.modalContainer)) {
      document.body.removeChild(this.modalContainer);
      this.modalContainer = null;
    }
  }
}
