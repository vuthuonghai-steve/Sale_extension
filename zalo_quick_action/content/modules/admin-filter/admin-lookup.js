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

    // 2. Pattern dạng phòng kết hợp số phòng ngủ & khách (2n1k, 3n1k, 1n1k, 1k1n...)
    const n1kRegex = /\b\d{1,2}[nN]\d{1,2}[kK]\b|\b\d{1,2}[kK]\d{1,2}[nN]\b/iu;
    const n1kMatch = rawText.match(n1kRegex);
    if (n1kMatch) return n1kMatch[0].trim();

    // 3. Pattern X phòng ngủ / X p ngủ / X pn / X n (VD: 2 phòng ngủ, 3 phòng ngủ, 2p ngủ, 2pn, 2n, 3n)
    const roomPatternRegex = /\b\d{1,2}[ \t]*(?:phòng[ \t]*ngủ|p[ \t]*ngủ|pn)\b|\b\d{1,2}[nN]\b/iu;
    const roomPatternMatch = rawText.match(roomPatternRegex);
    if (roomPatternMatch) return roomPatternMatch[0].trim();

    // 4. Pattern Studio / Duplex
    const studioRegex = /\b(?:studio|duplex)\b/iu;
    const studioMatch = rawText.match(studioRegex);
    if (studioMatch) return studioMatch[0].trim();

    return null;
  }

  function lookupAdminData(rawQuery) {
    if (!adminData || !rawQuery) return null;

    const trimmed = rawQuery.trim();
    const norm = normalizeText(trimmed);

    if (!norm) return null;

    // Direct Hash Lookup
    if (adminData.lookupIndex[trimmed]) return adminData.lookupIndex[trimmed];
    if (adminData.lookupIndex[norm]) return adminData.lookupIndex[norm];

    // Cleaned Address Lookup
    const cleaned = cleanAddressQuery(trimmed);
    const cleanedNorm = normalizeText(cleaned);

    if (cleanedNorm && adminData.lookupIndex[cleanedNorm]) {
      return adminData.lookupIndex[cleanedNorm];
    }

    // Substring matching over index entries
    for (const key in adminData.lookupIndex) {
      if (key.length >= 3 && (norm.includes(key) || key.includes(norm) || (cleanedNorm && (cleanedNorm.includes(key) || key.includes(cleanedNorm))))) {
        return adminData.lookupIndex[key];
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

    // Helper kiểm tra dạng phòng có thuộc nhóm 2n và 3n hay không (2n1k, 3n1k, 2n, 3n, 2/3 phòng ngủ...)
    isTargetRoomType(roomTypeStr) {
      if (!roomTypeStr) return false;
      const targetRegex = /^(?:2[nN]1[kK]|3[nN]1[kK]|2[nN]|3[nN]|2[ \t]*(?:phòng|p)?[ \t]*ngủ|3[ \t]*(?:phòng|p)?[ \t]*ngủ|2[pP][nN]|3[pP][nN])$/iu;
      return targetRegex.test(roomTypeStr.trim());
    },

    // Prioritizes Room Type ONLY for 2n & 3n cases > Otherwise fallbacks to District lookup
    lookupSearchTarget(rawQuery) {
      const roomType = extractRoomType(rawQuery);
      if (roomType && this.isTargetRoomType(roomType)) {
        return { type: 'room', value: roomType };
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
