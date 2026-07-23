// Content Module: Admin Location Lookup (District / Quận Huyện Identification)
(function () {
  'use strict';

  let adminData = null;

  async function initData() {
    try {
      if (chrome.runtime && chrome.runtime.getURL) {
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

    lookupFull(rawQuery) {
      return lookupAdminData(rawQuery);
    }
  };

  initData();
})();
