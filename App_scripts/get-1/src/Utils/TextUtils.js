/**
 * @file src/Utils/TextUtils.js
 * Tiện ích làm sạch chuỗi, định dạng giá tiền, ngày tháng và loại thang
 */

/**
 * Làm sạch chuỗi văn bản
 * @param {any} val 
 * @returns {string}
 */
function cleanText(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    return formatDateValue(val);
  }

  let text = String(val).trim();

  // Xóa dấu ngoặc kép bọc ngoài bị escape
  while (
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2)
  ) {
    text = text.slice(1, -1).trim();
  }

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text;
}

/**
 * Định dạng ngày tháng
 * @param {any} val 
 * @returns {string}
 */
function formatDateValue(val) {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return cleanText(val);
}

/**
 * Chuẩn hóa giá tiền dạng số nguyên VNĐ
 * @param {any} rawPrice 
 * @returns {number}
 */
function parsePrice(rawPrice) {
  if (typeof rawPrice === 'number') return Math.round(rawPrice);
  const cleaned = String(rawPrice || "0").replace(/[^0-9.-]+/g, "");
  let val = parseFloat(cleaned) || 0;
  if (val > 0 && val < 100) {
    val = val * 1000000;
  }
  return Math.round(val);
}

/**
 * Định dạng giá tiền hiển thị trực quan
 * @param {number} amount 
 * @returns {string}
 */
function formatPriceText(amount) {
  if (!amount || amount <= 0) return "Thỏa thuận";
  if (amount >= 1000000) {
    const trieu = amount / 1000000;
    return `${trieu.toLocaleString('vi-VN')} triệu/tháng`;
  }
  return `${amount.toLocaleString('vi-VN')} đ/tháng`;
}

/**
 * Chuẩn hóa loại thang di chuyển
 * @param {string} rawElevator 
 * @returns {string}
 */
function normalizeElevator(rawElevator) {
  const clean = cleanText(rawElevator);
  if (!clean) return "";

  const lower = clean.toLowerCase();
  if (lower.includes("máy") || lower === "máy" || lower === "may") {
    return CONSTANTS.ELEVATOR_TYPES.ELEVATOR;
  }
  if (lower.includes("bộ") || lower.includes("bo")) {
    if (lower.includes("tầng 3") || lower.includes("tang 3")) {
      return "Thang bộ (Tầng 3)";
    }
    if (lower.includes("tầng 2") || lower.includes("tang 2")) {
      return "Thang bộ (Tầng 2)";
    }
    return CONSTANTS.ELEVATOR_TYPES.STAIRS;
  }
  return clean;
}
