// Content Module: Admin Location Lookup (District / Quận Huyện Identification)
(function () {
  'use strict';

  let adminData = null;

  async function initData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime.getURL) {
        const dataUrl = chrome.runtime.getURL('data/hanoi_admin_data.min.json');
        const res = await fetch(dataUrl);
        adminData = await res.json();
        console.log('[ZaloAdminLookup] ✅ Admin location dataset loaded into RAM.');
      }
    } catch (err) {
      console.error('[ZaloAdminLookup] ❌ Failed to load admin dataset:', err);
    }
  }

  function normalizeText(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanAddressQuery(rawText) {
    if (!rawText) return '';
    let text = rawText.trim();

    text = text.replace(/^(số|nhà|ngõ|ngách|hẻm|tổ|kđt|khu đô thị)\s+[\d\/a-z\-]+/gi, '');
    text = text.replace(/^[\d\/a-z\-]+\s+/gi, '');
    return text.trim();
  }

  // Extract room type from message (e.g. 2n1k, 3n1k, 2n, 3n, 2 phòng ngủ, studio, duplex...)
  function extractRoomType(rawText) {
    if (!rawText) return null;

    // 1. Ưu tiên tìm nhãn "Dạng phòng", "Loại phòng", "Phòng"
    // Ví dụ: "☘Dạng phòng : 2n1k", "Dạng phòng: 3n1k", "Loại phòng: 2 phòng ngủ"
    const labelRegex = /(?:Dạng|Loại)[ \t]*phòng[ \t]*:?[ \t]*([^\n\r,;\t]+)/iu;
    const labelMatch = rawText.match(labelRegex);
    if (labelMatch && labelMatch[1]) {
      let roomVal = labelMatch[1].trim();
      // Strip leading/trailing non-alphanumeric unicode icons/emojis
      roomVal = roomVal.replace(/^[^\w\s\u00C0-\u024F\u1EA0-\u1EF9]+|[^\w\s\u00C0-\u024F\u1EA0-\u1EF9]+$/g, '').trim();
      if (roomVal) return roomVal;
    }

    // 2. Ưu tiên quét TẤT CẢ các cụm từ khớp dạng phòng 2n/3n trong toàn bộ văn bản (VD: "1N1K, 2N1K TẠI MỸ ĐÌNH" -> bắt được 2N1K)
    const targetRoomRegex = /\b(?:2[nN]1[kK]|3[nN]1[kK]|2[nN]|3[nN]|2[ \t]*(?:phòng|p)?[ \t]*ngủ|3[ \t]*(?:phòng|p)?[ \t]*ngủ|2[pP][nN]|3[pP][nN])\b/giu;
    const targetMatches = rawText.match(targetRoomRegex);
    if (targetMatches && targetMatches.length > 0) {
      return targetMatches[0].trim();
    }

    // 3. Pattern dạng phòng kết hợp số phòng ngủ & khách khác (1n1k, 1k1n, 4n1k...)
    const n1kRegex = /\b\d{1,2}[nN]\d{1,2}[kK]\b|\b\d{1,2}[kK]\d{1,2}[nN]\b/iu;
    const n1kMatch = rawText.match(n1kRegex);
    if (n1kMatch) return n1kMatch[0].trim();

    // 4. Pattern X phòng ngủ / X p ngủ / X pn / X n khác (VD: 1 phòng ngủ, 1p ngủ, 1pn, 1n, 4n...)
    const roomPatternRegex = /\b\d{1,2}[ \t]*(?:phòng[ \t]*ngủ|p[ \t]*ngủ|pn)\b|\b\d{1,2}[nN]\b/iu;
    const roomPatternMatch = rawText.match(roomPatternRegex);
    if (roomPatternMatch) return roomPatternMatch[0].trim();

    // 5. Pattern Studio / Duplex
    const studioRegex = /\b(?:studio|duplex)\b/iu;
    const studioMatch = rawText.match(studioRegex);
    if (studioMatch) return studioMatch[0].trim();

    return null;
  }

  // Dictionary of District Aliases & Common Typos (Specifically for Hanoi & Real Estate Listings)
  const DISTRICT_ALIASES = {
    // Nam Từ Liêm
    'nam tu liem': 'Nam Từ Liêm',
    'nam thu liem': 'Nam Từ Liêm',
    'n tu liem': 'Nam Từ Liêm',
    'n thu liem': 'Nam Từ Liêm',
    'ntl': 'Nam Từ Liêm',

    // Bắc Từ Liêm
    'bac tu liem': 'Bắc Từ Liêm',
    'bac thu liem': 'Bắc Từ Liêm',
    'b tu liem': 'Bắc Từ Liêm',
    'b thu liem': 'Bắc Từ Liêm',
    'btl': 'Bắc Từ Liêm',

    // Cầu Giấy
    'cau giay': 'Cầu Giấy',
    'cg': 'Cầu Giấy',

    // Đống Đa
    'dong da': 'Đống Đa',
    'dd': 'Đống Đa',

    // Hai Bà Trưng
    'hai ba trung': 'Hai Bà Trưng',
    'hbt': 'Hai Bà Trưng',

    // Hoàng Mai
    'hoang mai': 'Hoàng Mai',
    'hm': 'Hoàng Mai',

    // Thanh Xuân
    'thanh xuan': 'Thanh Xuân',
    'tx': 'Thanh Xuân',

    // Tây Hồ
    'tay ho': 'Tây Hồ',
    'th': 'Tây Hồ',

    // Hoàn Kiếm
    'hoan kiem': 'Hoàn Kiếm',
    'hk': 'Hoàn Kiếm',

    // Ba Đình
    'ba dinh': 'Ba Đình',
    'bd': 'Ba Đình',

    // Hà Đông
    'ha dong': 'Hà Đông',
    'hd': 'Hà Đông',

    // Long Biên
    'long bien': 'Long Biên',
    'lb': 'Long Biên',

    // Thanh Trì
    'thanh tri': 'Thanh Trì',
    'tt': 'Thanh Trì',

    // Gia Lâm
    'gia lam': 'Gia Lâm',
    'gl': 'Gia Lâm',

    // Đông Anh
    'dong anh': 'Đông Anh',
    'da': 'Đông Anh',

    // Hoài Đức
    'hoai duc': 'Hoài Đức'
  };

  // Supplemental Street & Landmark Map (Maps prominent Hanoi streets/areas to standard District names)
  const STREET_LANDMARK_MAP = {
    // Đống Đa
    'tam khuong': 'Đống Đa',
    'ton that tung': 'Đống Đa',
    'chua boc': 'Đống Đa',
    'pham ngoc thach': 'Đống Đa',
    'nguyen luong bang': 'Đống Đa',
    'tay son': 'Đống Đa',
    'xa dan': 'Đống Đa',
    'kham thien': 'Đống Đa',
    'chua lang': 'Đống Đa',
    'huynh thuc khang': 'Đống Đa',
    'thai ha': 'Đống Đa',
    'thai thinh': 'Đống Đa',
    'yen lang': 'Đống Đa',
    'hoang cau': 'Đống Đa',
    'dang tien dong': 'Đống Đa',
    'trung tu': 'Đống Đa',
    'kim lien': 'Đống Đa',
    'phuong mai': 'Đống Đa',

    // Cầu Giấy
    'cau giay': 'Cầu Giấy',
    'duy tan': 'Cầu Giấy',
    'hoang quoc viet': 'Cầu Giấy',
    'xuan thuy': 'Cầu Giấy',
    'nguyen phong sac': 'Cầu Giấy',
    'tran thai tong': 'Cầu Giấy',
    'trung hoa': 'Cầu Giấy',
    'yen hoa': 'Cầu Giấy',
    'dich vong': 'Cầu Giấy',
    'mai dich': 'Cầu Giấy',
    'nghia tan': 'Cầu Giấy',
    'quan hoa': 'Cầu Giấy',
    'nguyen khanh toan': 'Cầu Giấy',
    'nguyen van huyen': 'Cầu Giấy',
    'tran dang ninh': 'Cầu Giấy',
    'nguyen thi dinh': 'Cầu Giấy',
    'nguyen thi thap': 'Cầu Giấy',
    'hoang ngan': 'Cầu Giấy',
    'phan van truong': 'Cầu Giấy',

    // Thanh Xuân
    'nguyen trai': 'Thanh Xuân',
    'khuong trung': 'Thanh Xuân',
    'khuong dinh': 'Thanh Xuân',
    'khuong mai': 'Thanh Xuân',
    'ha dinh': 'Thanh Xuân',
    'bui xuong trach': 'Thanh Xuân',
    'vu tong phan': 'Thanh Xuân',
    'quan nhan': 'Thanh Xuân',
    'nhan chinh': 'Thanh Xuân',
    'le van luong': 'Thanh Xuân',
    'nguyen tuan': 'Thanh Xuân',
    'nguyen huy tuong': 'Thanh Xuân',
    'nguy nhu kon tum': 'Thanh Xuân',
    'vu trong phung': 'Thanh Xuân',
    'trieu khuc': 'Thanh Xuân',

    // Hai Bà Trưng
    'bach khoa': 'Hai Bà Trưng',
    'tran dai nghia': 'Hai Bà Trưng',
    'ta quang buu': 'Hai Bà Trưng',
    'dai la': 'Hai Bà Trưng',
    'minh khai': 'Hai Bà Trưng',
    'truong dinh': 'Hai Bà Trưng',
    'bach mai': 'Hai Bà Trưng',
    'pho hue': 'Hai Bà Trưng',
    'ba trieu': 'Hai Bà Trưng',
    'lac trung': 'Hai Bà Trưng',
    'kim nguu': 'Hai Bà Trưng',
    'thanh nhan': 'Hai Bà Trưng',

    // Ba Đình
    'kim ma': 'Ba Đình',
    'doi can': 'Ba Đình',
    'lieu giai': 'Ba Đình',
    'van cao': 'Ba Đình',
    'giang vo': 'Ba Đình',
    'ngoc khanh': 'Ba Đình',
    'phan ke binh': 'Ba Đình',
    'linh lang': 'Ba Đình',
    'quan thanh': 'Ba Đình',

    // Tây Hồ
    'thuy khue': 'Tây Hồ',
    'trich sai': 'Tây Hồ',
    'nhat tan': 'Tây Hồ',
    'xuan la': 'Tây Hồ',
    'phu thuong': 'Tây Hồ',
    'quang an': 'Tây Hồ',
    'dang thai mai': 'Tây Hồ',
    'to ngoc van': 'Tây Hồ',

    // Hoàng Mai
    'dinh cong': 'Hoàng Mai',
    'dai kim': 'Hoàng Mai',
    'hoang liet': 'Hoàng Mai',
    'linh dam': 'Hoàng Mai',
    'tan mai': 'Hoàng Mai',
    'linh nam': 'Hoàng Mai',
    'mai dong': 'Hoàng Mai',
    'vinh hung': 'Hoàng Mai',
    'giap bat': 'Hoàng Mai',

    // Hà Đông
    'mo lao': 'Hà Đông',
    'van quan': 'Hà Đông',
    'la khe': 'Hà Đông',
    'duong noi': 'Hà Đông',
    'yen nghia': 'Hà Đông',
    'xa la': 'Hà Đông',
    'phuc la': 'Hà Đông',
    'kien hung': 'Hà Đông',

    // Nam Từ Liêm
    'le quang dao': 'Nam Từ Liêm',
    'me tri': 'Nam Từ Liêm',
    'my dinh': 'Nam Từ Liêm',
    'phu do': 'Nam Từ Liêm',
    'dinh thon': 'Nam Từ Liêm',
    'cau dien': 'Nam Từ Liêm',
    'dai mo': 'Nam Từ Liêm',
    'tay mo': 'Nam Từ Liêm',
    'trung van': 'Nam Từ Liêm',
    'phuong canh': 'Nam Từ Liêm',
    'xuan phuong': 'Nam Từ Liêm',
    'do duc duc': 'Nam Từ Liêm',
    'ham nghi': 'Nam Từ Liêm',
    'nguyen hoang': 'Nam Từ Liêm',
    'nguyen van giap': 'Nam Từ Liêm',
    'tran huu duc': 'Nam Từ Liêm',
    'sa doi': 'Nam Từ Liêm',
    'smart city': 'Nam Từ Liêm',

    // Bắc Từ Liêm
    'co nhue': 'Bắc Từ Liêm',
    'phu dien': 'Bắc Từ Liêm',
    'phuc dien': 'Bắc Từ Liêm',
    'duc thang': 'Bắc Từ Liêm',
    'dong ngac': 'Bắc Từ Liêm',
    'xuan dinh': 'Bắc Từ Liêm',
    'xuan tao': 'Bắc Từ Liêm',
    'tay tuu': 'Bắc Từ Liêm',
    'ngoai giao doan': 'Bắc Từ Liêm'
  };

  // Extract candidate lines specifically related to addresses (Địa chỉ, Đ/c, Quận, Huyện, Vị trí...)
  function extractAddressLines(rawText) {
    if (!rawText) return [];
    const lines = rawText.split('\n');
    const addressLines = [];
    const addressKeywords = /(?:địa[ \t]*chỉ|đ\/c|đc|vị[ \t]*trí|khu[ \t]*vực|quận|huyện|đường|phố|ngõ|ngách|số[ \t]+\d+)/i;

    for (const line of lines) {
      if (addressKeywords.test(line)) {
        addressLines.push(line.trim());
      }
    }

    return addressLines;
  }

  function lookupAdminData(rawQuery) {
    if (!rawQuery) return null;

    const trimmed = rawQuery.trim();
    const norm = normalizeText(trimmed);
    if (!norm) return null;

    // 1. Direct District Alias Match
    if (DISTRICT_ALIASES[norm]) {
      return { type: 'district', data: { name: `Quận ${DISTRICT_ALIASES[norm]}` } };
    }

    // 2. Direct Hash Lookup in Dataset
    if (adminData && adminData.lookupIndex) {
      if (adminData.lookupIndex[trimmed]) return adminData.lookupIndex[trimmed];
      if (adminData.lookupIndex[norm]) return adminData.lookupIndex[norm];

      const cleaned = cleanAddressQuery(trimmed);
      const cleanedNorm = normalizeText(cleaned);
      if (cleanedNorm && adminData.lookupIndex[cleanedNorm]) {
        return adminData.lookupIndex[cleanedNorm];
      }
    }

    // 3. Explicit Regex Match for "Quận: ...", "Huyện: ...", "Q. ...", "H. ...", "- ĐỐNG ĐA"
    const explicitDistrictRegex = /(?:Quận|Huyện|Q\.|H\.|Tp\.|Thành[ \t]*phố|[-–—])[ \t]*([^\n\r,;\t]+)/gi;
    let match;
    while ((match = explicitDistrictRegex.exec(rawQuery)) !== null) {
      if (match[1]) {
        const candidateNorm = normalizeText(match[1]);
        if (DISTRICT_ALIASES[candidateNorm]) {
          return { type: 'district', data: { name: `Quận ${DISTRICT_ALIASES[candidateNorm]}` } };
        }
        for (const [aliasKey, distName] of Object.entries(DISTRICT_ALIASES)) {
          if (aliasKey.length >= 3 && (candidateNorm === aliasKey || candidateNorm.endsWith(` ${aliasKey}`))) {
            return { type: 'district', data: { name: `Quận ${distName}` } };
          }
        }
      }
    }

    // 4. Scoped Search over Address Lines & Full Text (Word-Boundary Protected)
    const addressLines = extractAddressLines(rawQuery);
    const searchTexts = addressLines.length > 0 ? [...addressLines, rawQuery] : [rawQuery];

    for (const searchText of searchTexts) {
      const normText = normalizeText(searchText);
      if (!normText) continue;

      // Check Street & Landmark Map FIRST with Word Boundary (Specific Street matches like "Tam Khương", "Lê Quang Đạo")
      for (const [streetKey, distName] of Object.entries(STREET_LANDMARK_MAP)) {
        const regex = new RegExp(`\\b${streetKey.replace(/ /g, '\\s+')}\\b`, 'i');
        if (regex.test(normText)) {
          return { type: 'street', data: { street: streetKey, districtName: `Quận ${distName}` } };
        }
      }

      // Check District Aliases with Word Boundary
      for (const [aliasKey, distName] of Object.entries(DISTRICT_ALIASES)) {
        if (aliasKey.length <= 2) continue; // Skip short 2-letter codes in broad search
        const regex = new RegExp(`\\b${aliasKey.replace(/ /g, '\\s+')}\\b`, 'i');
        if (regex.test(normText)) {
          return { type: 'district', data: { name: `Quận ${distName}` } };
        }
      }

      // Check Admin Dataset Lookup Index with Word Boundary (Prevents partial matches like "ma" inside "thang may")
      if (adminData && adminData.lookupIndex) {
        for (const key in adminData.lookupIndex) {
          const kNorm = normalizeText(key);
          if (kNorm.length < 4) continue; // Skip very short keys to avoid false positives

          const regex = new RegExp(`\\b${kNorm.replace(/ /g, '\\s+')}\\b`, 'i');
          if (regex.test(normText)) {
            return adminData.lookupIndex[key];
          }
        }
      }
    }

    return null;
  }

  window.ZaloAdminLookup = {
    async ensureData() {
      if (!adminData) {
        await initData();
      }
      return !!adminData;
    },

    extractRoomType(rawQuery) {
      return extractRoomType(rawQuery);
    },

    lookupDistrict(rawQuery) {
      const match = lookupAdminData(rawQuery);
      if (!match) return null;

      let fullName = null;
      if (match.type === 'district') {
        fullName = match.data ? match.data.name : null;
      } else if (match.type === 'ward' || match.type === 'street') {
        fullName = match.data ? match.data.districtName : null;
      }

      if (!fullName) return null;
      // Strip administrative prefixes ("Quận ", "Huyện ", "Thị xã ", etc.) so variable A contains ONLY pure name
      return fullName.replace(/^(Quận|Huyện|Thị xã|TP\.|Thành phố)\s+/i, '').trim();
    },

    // Chuẩn hóa dạng phòng về từ khóa tìm kiếm cố định ("2n1k" cho 2 ngủ/2n, "3n1k" cho 3 ngủ/3n)
    normalizeRoomTypeSearchValue(roomTypeStr) {
      if (!roomTypeStr) return null;
      const str = roomTypeStr.trim();

      // Nhóm 2 phòng ngủ (2n1k, 2n, 2 ngủ, 2pn, 2p ngủ...) -> Chuẩn hóa thành "2n1k"
      if (/^(?:2[nN]1[kK]|2[nN]|2[ \t]*(?:phòng|p)?[ \t]*ngủ|2[pP][nN])$/iu.test(str)) {
        return '2n1k';
      }

      // Nhóm 3 phòng ngủ (3n1k, 3n, 3 ngủ, 3pn, 3p ngủ...) -> Chuẩn hóa thành "3n1k"
      if (/^(?:3[nN]1[kK]|3[nN]|3[ \t]*(?:phòng|p)?[ \t]*ngủ|3[pP][nN])$/iu.test(str)) {
        return '3n1k';
      }

      return null;
    },

    // Prioritizes Room Type ONLY for 2n (normalized to "2n1k") & 3n (normalized to "3n1k") > Otherwise fallbacks to District lookup
    lookupSearchTarget(rawQuery) {
      const roomType = extractRoomType(rawQuery);
      if (roomType) {
        const normalizedRoom = this.normalizeRoomTypeSearchValue(roomType);
        if (normalizedRoom) {
          return { type: 'room', value: normalizedRoom };
        }
      }

      const district = this.lookupDistrict(rawQuery);
      if (district) {
        return { type: 'district', value: district };
      }

      return null;
    },

    lookupFull(rawQuery) {
      return lookupAdminData(rawQuery);
    }
  };

  initData();
})();
