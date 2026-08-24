/**
 * @file src/Utils/PhoneUtils.js
 * Tiện ích bóc tách và chuẩn hóa số điện thoại liên hệ
 */

/**
 * Tách và làm sạch danh sách số điện thoại từ ô văn bản hỗn hợp
 * Xử lý chính xác các trường hợp chứa chữ (zalo ...), phân tách bởi '/', '\n', v.v.
 * @param {string} rawPhone 
 * @returns {Array<string>}
 */
function parseCleanPhones(rawPhone) {
  if (!rawPhone) return [];

  // Tách chuỗi theo dấu phân cách rõ ràng: newline, slash, semicolon, comma, hoặc từ khóa 'zalo', 'lh', 'sdt', 'tel'
  const chunks = String(rawPhone).split(/[\r\n\/;,|]|\b(?:zalo|lh|sdt|tel)\b/i);
  const phones = new Set();

  chunks.forEach(chunk => {
    if (!chunk || !chunk.trim()) return;

    // Loại bỏ các ký tự phân cách phụ trong số điện thoại (chấm, khoảng trắng, gạch ngang)
    const digitsOnly = chunk.replace(/[^\d\+]/g, '');
    
    // Tìm các mẫu số điện thoại Việt Nam hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84/84)
    const matches = digitsOnly.match(/(?:\+84|84|0)(?:3|5|7|8|9)\d{8}/g);
    if (matches) {
      matches.forEach(m => {
        let p = m;
        if (p.startsWith('+84')) {
          p = '0' + p.slice(3);
        } else if (p.startsWith('84') && p.length === 11) {
          p = '0' + p.slice(2);
        }
        if (p.length === 10) {
          phones.add(p);
        }
      });
    }
  });

  return Array.from(phones);
}
