/**
 * Utility cho Tự động hóa nhẹ: Fill Form, Scrape Data, Auto Click
 */

// 1. Tự động điền dữ liệu vào Form (mô phỏng thao tác gõ của người dùng thật)
export function fillInput(selector: string, value: string): boolean {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element) {
    console.warn(`[Automation] Không tìm thấy element: ${selector}`);
    return false;
  }

  element.focus();
  element.value = value;

  // Bắt buộc trigger sự kiện 'input' và 'change' để React/Vue/Angular nhận biết giá trị mới
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();

  // Hiệu ứng viền xanh thông báo đã điền thành công
  const originalOutline = element.style.outline;
  element.style.outline = '2px solid #10b981';
  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 1000);

  return true;
}

// 2. Tự động Click vào nút bấm
export function clickButton(selector: string): boolean {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    console.warn(`[Automation] Không tìm thấy nút: ${selector}`);
    return false;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.click();
  return true;
}

// 3. Cào dữ liệu nhẹ (Scrape Data)
export interface ScrapedSummary {
  title: string;
  url: string;
  headings: string[];
  inputsFound: number;
  timestamp: string;
}

export function scrapePageData(): ScrapedSummary {
  const headings = Array.from(document.querySelectorAll('h1, h2'))
    .map((el) => el.textContent?.trim() || '')
    .filter(Boolean)
    .slice(0, 5);

  const inputsFound = document.querySelectorAll('input, select, textarea').length;

  return {
    title: document.title,
    url: window.location.href,
    headings,
    inputsFound,
    timestamp: new Date().toLocaleTimeString(),
  };
}
