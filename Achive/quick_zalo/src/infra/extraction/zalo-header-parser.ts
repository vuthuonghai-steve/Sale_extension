import { HEADER_TITLE_SELECTORS } from './zalo-selectors.const';

export function parseActiveConversationName(root: Document | HTMLElement = document): string | null {
  const titleEl = root.querySelector(HEADER_TITLE_SELECTORS);
  if (!titleEl) return null;

  let name = titleEl.textContent?.trim() || '';
  name = name
    .replace(/\n+/g, ' ')
    .replace(/Vừa mới truy cập.*/i, '')
    .replace(/Truy cập.*trước/i, '')
    .replace(/Hoạt động.*/i, '')
    .trim();

  return name || null;
}
