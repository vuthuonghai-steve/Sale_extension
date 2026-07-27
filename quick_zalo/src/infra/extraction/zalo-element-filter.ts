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
