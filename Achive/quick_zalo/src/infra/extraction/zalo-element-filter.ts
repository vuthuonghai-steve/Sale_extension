/**
 * @file zalo-element-filter.ts
 * @layer Infrastructure Layer (@infra/extraction)
 * @description Bộ lọc vị trí và cấu trúc phần tử DOM Zalo Web.
 *
 * Trách nhiệm chính:
 * - `isSidebarElement`: Loại bỏ các phần tử trùng selector nằm ở danh sách cuộc trò chuyện bên trái (Left Sidebar).
 * - `isHeaderOrBannerElement`: Loại bỏ các banner ghim, chủ đề topic header ở trên cùng khung chat.
 * - `getLeafMessageNodes`: Truy vấn và trả về danh sách các HTML Node tin nhắn lá (Leaf nodes) nằm trong khung chat chính theo thứ tự từ trên xuống dưới.
 */

import { SELECTOR_MESSAGE_NODES } from './zalo-selectors.const';

export function isSidebarElement(node: HTMLElement, dataId: string): boolean {
  return (
    dataId.startsWith('div_TabMsg_') ||
    node.closest('#conversationList') !== null ||
    node.closest('.ReactVirtualized__Grid') !== null ||
    node.closest('.ReactVirtualized__List') !== null ||
    node.closest('.left-panel') !== null ||
    node.closest('#conversation-list') !== null ||
    node.closest('.conv-item') !== null
  );
}

export function isHeaderOrBannerElement(node: HTMLElement): boolean {
  return (
    node.closest('.list-chat-box-banner') !== null ||
    node.closest('.chat-group-topic-outer') !== null ||
    node.closest('.chat-group-topic') !== null ||
    node.closest('.pinned-board') !== null ||
    node.closest('.header-title') !== null ||
    node.closest('#header-title') !== null ||
    node.closest('#header') !== null ||
    node.closest('.chat-header') !== null
  );
}

export function getLeafMessageNodes(root: Document | HTMLElement = document): HTMLElement[] {
  const messageElements = root.querySelectorAll(SELECTOR_MESSAGE_NODES);
  const nodeArray = Array.from(messageElements) as HTMLElement[];

  return nodeArray.filter((node) => {
    const dataId = node.getAttribute('data-id') || '';

    // 1. Exclude left sidebar conversation items
    if (isSidebarElement(node, dataId)) {
      return false;
    }

    // 2. Exclude top banners, topic previews, and headers
    if (isHeaderOrBannerElement(node)) {
      return false;
    }

    // 3. Filter out parent containers if child element also matches SELECTOR_MESSAGE_NODES
    const childMatch = node.querySelector(SELECTOR_MESSAGE_NODES);
    return !childMatch;
  });
}
