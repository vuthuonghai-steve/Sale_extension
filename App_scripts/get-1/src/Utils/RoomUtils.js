/**
 * @file src/Utils/RoomUtils.js
 * Tiện ích chuẩn hóa danh sách phòng và suy luận số phòng thông minh
 */

/**
 * Tách danh sách phòng con nếu ô có nhiều phòng ghép (ví dụ: "106, 105" hoặc "302, 303")
 * @param {string} rawRoom 
 * @returns {Array<string>}
 */
function parseCleanRooms(rawRoom) {
  if (!rawRoom) return [];
  return String(rawRoom)
    .split(/[,;\/\+]+/)
    .map(r => r.trim())
    .filter(r => r.length > 0);
}

/**
 * Suy luận và trích xuất số phòng thông minh từ tên file media hoặc text cột media
 * Ví dụ: "303.mp4" -> "303", "p202" -> "202", "p101" -> "101"
 * @param {string} rawRoom - Giá trị ô phòng trống
 * @param {string} rawMediaText - Giá trị text tại ô media
 * @returns {{ resolvedRoom: string, isFromMedia: boolean }}
 */
function inferRoomNumber(rawRoom, rawMediaText) {
  const cleanRoom = cleanText(rawRoom);
  const cleanMedia = cleanText(rawMediaText);

  // Nếu ô phòng trống đã có giá trị rõ ràng (không phải mô tả chung như "Nhà 3 tầng", "Studio...")
  const isGenericDesc = /^(nhà\s*\d+\s*tầng|studio|phòng\s*trống)$/i.test(cleanRoom);
  if (cleanRoom && !isGenericDesc) {
    // Làm sạch tiền tố p / P. nếu có
    const normalizedDirect = cleanRoom.replace(/^[pP]\.?\s*(\d+)/, '$1');
    return { resolvedRoom: normalizedDirect || cleanRoom, isFromMedia: false };
  }

  // Thử suy luận từ text cột media hoặc tên tệp media (vd: 303.mp4, p202, 1010)
  if (cleanMedia) {
    const match = cleanMedia.match(/\b[pP]?(\d{2,4}[a-zA-Z]?)(?:\.\w+)?\b/);
    if (match && match[1]) {
      return { resolvedRoom: match[1], isFromMedia: true };
    }
  }

  return { resolvedRoom: cleanRoom, isFromMedia: false };
}
