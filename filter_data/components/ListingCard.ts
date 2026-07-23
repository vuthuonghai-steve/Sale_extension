import type { CleanListingRecord } from '../utils/data-cleaner/types';

export interface ListingCardCallbacks {
  onFillData?: (record: CleanListingRecord) => void;
  onViewDetail?: (record: CleanListingRecord) => void;
  onCopyText?: (record: CleanListingRecord) => void;
}

export class ListingCard {
  public static formatPriceVnd(priceVnd?: number): string {
    if (!priceVnd || priceVnd <= 0) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(priceVnd);
  }

  public static renderHTML(
    record: CleanListingRecord,
    compact = false
  ): string {
    const formattedPrice = ListingCard.formatPriceVnd(record.priceVnd);
    const roomTypeLabel = record.roomType || 'Phòng Trọ';
    const districtLabel = record.district || 'Khác';
    const address = record.address || 'Đang cập nhật địa chỉ';
    const managerCode = record.managerCode ? `[Mã: ${record.managerCode}]` : '';

    const allowPet = record.policies?.allowPet;
    const allowEV = record.policies?.allowElectricVehicle;

    return `
      <div class="listing-card ${compact ? 'listing-card-compact' : ''}" data-id="${record.id}">
        <div class="listing-card-header">
          <div class="listing-price-badge">
            <span class="price-value">${formattedPrice}</span>
            <span class="price-unit">/tháng</span>
          </div>
          <div class="listing-meta-badges">
            <span class="badge badge-district">${districtLabel}</span>
            <span class="badge badge-roomtype">${roomTypeLabel}</span>
          </div>
        </div>

        <div class="listing-card-body">
          <div class="listing-address" title="${address}">
            📍 <strong>${address}</strong>
          </div>

          <div class="listing-policies">
            ${allowPet ? '<span class="tag tag-success" title="Cho nuôi thú cưng">🐶 Cho Pet</span>' : ''}
            ${allowEV ? '<span class="tag tag-info" title="Cho phép xe điện">⚡ Xe Điện</span>' : ''}
            ${managerCode ? `<span class="tag tag-secondary">${managerCode}</span>` : ''}
          </div>
        </div>

        <div class="listing-card-actions">
          <button class="btn btn-xs btn-primary btn-action-fill" title="Điền dữ liệu vào trang web active tab">
            📝 Điền Form
          </button>
          <button class="btn btn-xs btn-outline btn-action-copy" title="Copy tóm tắt bài đăng">
            📋 Copy
          </button>
          <button class="btn btn-xs btn-ghost btn-action-detail" title="Xem chi tiết tin thô và dữ liệu làm sạch">
            🔍 Chi Tiết
          </button>
        </div>
      </div>
    `;
  }

  public static attachListeners(
    cardElement: HTMLElement,
    record: CleanListingRecord,
    callbacks: ListingCardCallbacks
  ): void {
    const fillBtn = cardElement.querySelector('.btn-action-fill');
    const copyBtn = cardElement.querySelector('.btn-action-copy');
    const detailBtn = cardElement.querySelector('.btn-action-detail');

    fillBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.onFillData?.(record);
    });

    copyBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const textToCopy =
        record.rawRef ||
        `[${record.district || 'HN'}] ${record.address} - ${ListingCard.formatPriceVnd(record.priceVnd)} ${record.managerCode ? `(Mã QL: ${record.managerCode})` : ''}`;
      await navigator.clipboard.writeText(textToCopy);
      callbacks.onCopyText?.(record);
    });

    detailBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      callbacks.onViewDetail?.(record);
    });
  }
}
