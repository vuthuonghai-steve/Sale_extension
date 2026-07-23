import type { CleanListingRecord } from '../utils/data-cleaner/types';
import { ListingCard, type ListingCardCallbacks } from './ListingCard';

export interface VirtualListOptions {
  itemHeight?: number;
  bufferSize?: number;
  compact?: boolean;
  callbacks: ListingCardCallbacks;
}

export class VirtualList {
  private container: HTMLElement;
  private items: CleanListingRecord[] = [];
  private itemHeight: number;
  private bufferSize: number;
  private compact: boolean;
  private callbacks: ListingCardCallbacks;

  private viewportEl!: HTMLElement;
  private phantomEl!: HTMLElement;
  private contentEl!: HTMLElement;

  constructor(container: HTMLElement, options: VirtualListOptions) {
    this.container = container;
    this.itemHeight = options.itemHeight || (options.compact ? 100 : 120);
    this.bufferSize = options.bufferSize || 5;
    this.compact = options.compact || false;
    this.callbacks = options.callbacks;

    this.initDOM();
  }

  private initDOM(): void {
    this.container.innerHTML = `
      <div class="virtual-list-viewport">
        <div class="virtual-list-phantom"></div>
        <div class="virtual-list-content"></div>
      </div>
    `;

    this.viewportEl = this.container.querySelector('.virtual-list-viewport')!;
    this.phantomEl = this.container.querySelector('.virtual-list-phantom')!;
    this.contentEl = this.container.querySelector('.virtual-list-content')!;

    this.viewportEl.addEventListener('scroll', () => {
      requestAnimationFrame(() => this.renderVirtualItems());
    });
  }

  public setItems(newItems: CleanListingRecord[]): void {
    this.items = newItems;
    this.phantomEl.style.height = `${this.items.length * this.itemHeight}px`;
    this.viewportEl.scrollTop = 0;
    this.renderVirtualItems();
  }

  private renderVirtualItems(): void {
    if (this.items.length === 0) {
      this.contentEl.innerHTML = `
        <div class="virtual-list-empty">
          <span class="empty-icon">🔍</span>
          <p>Không tìm thấy phòng trọ nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      `;
      this.contentEl.style.transform = 'translateY(0px)';
      return;
    }

    const scrollTop = this.viewportEl.scrollTop;
    const viewportHeight = this.viewportEl.clientHeight || 400;

    let startIndex = Math.floor(scrollTop / this.itemHeight) - this.bufferSize;
    let endIndex = Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.bufferSize;

    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(this.items.length, endIndex);

    const visibleItems = this.items.slice(startIndex, endIndex);
    const offsetY = startIndex * this.itemHeight;

    this.contentEl.style.transform = `translateY(${offsetY}px)`;

    const html = visibleItems
      .map((item) => ListingCard.renderHTML(item, this.compact))
      .join('');

    this.contentEl.innerHTML = html;

    // Gắn event listener cho từng card đang hiển thị
    const cardNodes = this.contentEl.querySelectorAll<HTMLElement>('.listing-card');
    cardNodes.forEach((cardNode, index) => {
      const record = visibleItems[index];
      if (record) {
        ListingCard.attachListeners(cardNode, record, this.callbacks);
      }
    });
  }
}
