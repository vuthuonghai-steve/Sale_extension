// Content Script: Ultra-Fast Admin Location Lookup & Floating Overlay
(function () {
  let adminData = null;
  let overlayContainer = null;
  let shadowRoot = null;

  // 1. Fetch & Cache Data in Memory (< 1ms lookup)
  async function initData() {
    try {
      const dataUrl = chrome.runtime.getURL('data/hanoi_admin_data.min.json');
      const res = await fetch(dataUrl);
      adminData = await res.json();
      console.log('[Hanoi Admin Lookup] ✅ Content Script Ready & Data loaded into RAM.');
    } catch (err) {
      console.error('[Hanoi Admin Lookup] ❌ Failed to load dataset:', err);
    }
  }

  initData();

  // 2. Fast String Normalization Helper
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

  // Smart Address Cleaner: Extract street / ward core name from full address
  function cleanAddressQuery(rawText) {
    if (!rawText) return '';
    let text = rawText.trim();

    // Strip numbers, alley prefixes (ngõ, ngách, hẻm, số, nhà, kđt, tổ)
    text = text.replace(/^(số|nhà|ngõ|ngách|hẻm|tổ|kđt|khu đô thị)\s+[\d\/a-z\-]+/gi, '');
    text = text.replace(/^[\d\/a-z\-]+\s+/gi, '');
    text = text.trim();

    return text;
  }

  // 3. Ultra-Fast Search Core (< 0.01ms)
  function lookupAdminData(rawQuery) {
    if (!adminData || !rawQuery) return null;

    const trimmed = rawQuery.trim();
    const norm = normalizeText(trimmed);

    if (!norm) return null;

    // Direct Hash Lookup
    if (adminData.lookupIndex[trimmed]) return adminData.lookupIndex[trimmed];
    if (adminData.lookupIndex[norm]) return adminData.lookupIndex[norm];

    // Cleaned Address Lookup (e.g., "Ngõ 123 Cầu Giấy" -> "Cầu Giấy")
    const cleaned = cleanAddressQuery(trimmed);
    const cleanedNorm = normalizeText(cleaned);

    if (cleanedNorm && adminData.lookupIndex[cleanedNorm]) {
      return adminData.lookupIndex[cleanedNorm];
    }

    // Substring matching over ~5,000 entries (< 0.01ms)
    for (const key in adminData.lookupIndex) {
      if (key.length >= 3 && (norm.includes(key) || key.includes(norm) || (cleanedNorm && (cleanedNorm.includes(key) || key.includes(cleanedNorm))))) {
        return adminData.lookupIndex[key];
      }
    }

    return null;
  }

  // 4. Create & Inject Shadow DOM Floating Overlay
  function ensureOverlayContainer() {
    if (overlayContainer) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'hanoi-admin-lookup-root';
    overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;

    shadowRoot = overlayContainer.attachShadow({ mode: 'open' });
    document.body.appendChild(overlayContainer);

    // Inject Styles into Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      .card-overlay {
        pointer-events: auto;
        position: fixed;
        top: 24px;
        right: 24px;
        width: 340px;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 14px;
        padding: 16px;
        color: #f8fafc;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.2);
        animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 2147483647;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-12px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 10px;
      }

      .card-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .badge {
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .badge-ward { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
      .badge-district { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
      .badge-street { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
      .badge-notfound { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

      .close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .close-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* LARGEST TEXT FOR DISTRICT NAME (QUẬN / HUYỆN) */
      .main-district-title {
        font-size: 22px;
        font-weight: 800;
        color: #38bdf8;
        letter-spacing: -0.3px;
        text-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
        margin-bottom: 2px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        color: #94a3b8;
        font-size: 12px;
      }

      .info-row span:last-child {
        color: #f1f5f9;
        font-weight: 500;
      }

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .btn {
        flex: 1;
        padding: 7px 10px;
        border: none;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: background 0.15s ease;
      }

      .btn-primary { background: #0284c7; color: #ffffff; }
      .btn-primary:hover { background: #0369a1; }

      .btn-secondary { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }
      .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: #ffffff; }

      .query-highlight {
        color: #38bdf8;
        font-weight: 600;
      }
    `;
    shadowRoot.appendChild(style);
  }

  // 5. Render Floating Card UI (District Name is the BIGGEST TITLE)
  function showCard(matchResult, rawQuery) {
    ensureOverlayContainer();

    const oldCard = shadowRoot.querySelector('.card-overlay');
    if (oldCard) oldCard.remove();

    const card = document.createElement('div');
    card.className = 'card-overlay';

    if (matchResult) {
      const { type, data } = matchResult;

      if (type === 'street') {
        card.innerHTML = `
          <div class="card-header">
            <div class="card-title-group">
              <span class="badge badge-street">Đơn vị Hành chính</span>
              <span style="font-size: 11px; color: #94a3b8;">TP. Hà Nội</span>
            </div>
            <button class="close-btn" id="closeCardBtn">×</button>
          </div>
          <div class="card-body">
            <!-- BIGGEST TEXT FOR DISTRICT NAME -->
            <div class="main-district-title">${data.districtName}</div>
            
            <div class="info-row">
              <span>Đường / Phố:</span>
              <span><strong>Phố ${data.streetName}</strong></span>
            </div>
            <div class="info-row">
              <span>Phường / Xã tương ứng:</span>
              <span>${data.wardName}</span>
            </div>
            <div class="info-row">
              <span>Từ khóa bôi đen:</span>
              <span class="query-highlight">"${rawQuery}"</span>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="openMapBtn">🗺️ Mở Google Maps</button>
              <button class="btn btn-secondary" id="copyInfoBtn">📋 Sao chép</button>
            </div>
          </div>
        `;
      } else if (type === 'ward') {
        card.innerHTML = `
          <div class="card-header">
            <div class="card-title-group">
              <span class="badge badge-ward">${data.wardType}</span>
              <span style="font-size: 11px; color: #94a3b8;">TP. Hà Nội</span>
            </div>
            <button class="close-btn" id="closeCardBtn">×</button>
          </div>
          <div class="card-body">
            <!-- BIGGEST TEXT FOR DISTRICT NAME -->
            <div class="main-district-title">${data.districtName}</div>

            <div class="info-row">
              <span>Đơn vị Phường / Xã:</span>
              <span><strong>${data.fullName}</strong></span>
            </div>
            <div class="info-row">
              <span>Từ khóa bôi đen:</span>
              <span class="query-highlight">"${rawQuery}"</span>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="openMapBtn">🗺️ Mở Google Maps</button>
              <button class="btn btn-secondary" id="copyInfoBtn">📋 Sao chép</button>
            </div>
          </div>
        `;
      } else if (type === 'district') {
        card.innerHTML = `
          <div class="card-header">
            <div class="card-title-group">
              <span class="badge badge-district">${data.adminType}</span>
              <span style="font-size: 11px; color: #94a3b8;">TP. Hà Nội</span>
            </div>
            <button class="close-btn" id="closeCardBtn">×</button>
          </div>
          <div class="card-body">
            <!-- BIGGEST TEXT FOR DISTRICT NAME -->
            <div class="main-district-title">${data.name}</div>

            <div class="info-row">
              <span>Diện tích (2022):</span>
              <span>${data.area} km²</span>
            </div>
            <div class="info-row">
              <span>Dân số (2022):</span>
              <span>${data.population} người</span>
            </div>
            <div class="info-row">
              <span>Đơn vị trực thuộc:</span>
              <span>${data.subUnitsInfo} (${data.wardCount})</span>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="openMapBtn">🗺️ Mở Google Maps</button>
              <button class="btn btn-secondary" id="copyInfoBtn">📋 Sao chép</button>
            </div>
          </div>
        `;
      }

      shadowRoot.appendChild(card);

      // Event listeners
      card.querySelector('#closeCardBtn').onclick = () => card.remove();
      card.querySelector('#openMapBtn').onclick = () => {
        let query = '';
        if (type === 'street') query = `Đường ${data.streetName}, ${data.districtName}, Hà Nội`;
        else if (type === 'ward') query = `${data.fullName}, ${data.districtName}, Hà Nội`;
        else query = `${data.name}, Hà Nội`;
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
      };
      card.querySelector('#copyInfoBtn').onclick = (e) => {
        let textToCopy = '';
        if (type === 'street') textToCopy = `${data.districtName} - Đường ${data.streetName} (${data.wardName})`;
        else if (type === 'ward') textToCopy = `${data.districtName} - ${data.fullName}`;
        else textToCopy = `${data.name}, Hà Nội | Dân số: ${data.population} người | Diện tích: ${data.area} km²`;

        navigator.clipboard.writeText(textToCopy);
        e.target.textContent = '✅ Đã chép!';
        setTimeout(() => { e.target.textContent = '📋 Sao chép'; }, 1500);
      };
    } else {
      // Not found UI
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <span class="badge badge-notfound">Chưa thấy</span>
            <span style="font-size: 11px; color: #94a3b8;">Hành chính Hà Nội</span>
          </div>
          <button class="close-btn" id="closeCardBtn">×</button>
        </div>
        <div class="card-body">
          <div style="color: #cbd5e1;">Không tìm thấy dữ liệu phù hợp với:</div>
          <div class="main-district-title" style="font-size: 16px; color: #f87171;">"${rawQuery}"</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Mẹo: Bôi đen tên Đường, Phố, Ngõ, Phường, Xã hoặc Quận Huyện thuộc TP. Hà Nội.
          </div>
        </div>
      `;
      shadowRoot.appendChild(card);
      card.querySelector('#closeCardBtn').onclick = () => card.remove();
    }

    setTimeout(() => {
      if (card && card.isConnected) card.remove();
    }, 8000);
  }

  // 6. Handle Lookup Action
  function processSelectionLookup(customQuery = null) {
    const selectedText = customQuery || (window.getSelection() ? window.getSelection().toString().trim() : '');

    if (!selectedText) {
      console.log('[Hanoi Admin Lookup] ⚠️ Alt+M pressed but no text selected.');
      showToastNotice('⚠️ Vui lòng bôi đen tên địa điểm/tên đường cần tra cứu (Alt + M)');
      return;
    }

    const t0 = performance.now();
    const result = lookupAdminData(selectedText);
    const elapsed = performance.now() - t0;
    console.log(`[Hanoi Admin Lookup] ⚡ Lookup done in ${elapsed.toFixed(3)} ms for query: "${selectedText}"`, result);

    showCard(result, selectedText);

    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'SAVE_HISTORY', query: selectedText });
    }
  }

  function showToastNotice(msg) {
    ensureOverlayContainer();
    const oldToast = shadowRoot.querySelector('.toast-notice');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(250, 204, 21, 0.4);
      color: #fde047;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      z-index: 2147483647;
    `;
    toast.textContent = msg;
    shadowRoot.appendChild(toast);

    setTimeout(() => { if (toast) toast.remove(); }, 3000);
  }

  // 7. Event Listeners (Extension messages + Keyboard Shortcut Alt+M)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_SELECTION') {
      const selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';
      sendResponse({ text: selectedText });
    } else if (request.action === 'TRIGGER_SHORTCUT_LOOKUP') {
      console.log('[Hanoi Admin Lookup] 📩 Triggered via background command shortcut.');
      processSelectionLookup();
      sendResponse({ status: 'OK' });
    } else if (request.action === 'EXECUTE_ADMIN_LOOKUP') {
      processSelectionLookup(request.queryText);
      sendResponse({ status: 'OK' });
    }
  });

  // Direct Keydown Listener for Instant Alt+M Triggering
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
      console.log('[Hanoi Admin Lookup] 🔑 Alt+M keydown detected directly on page.');
      e.preventDefault();
      processSelectionLookup();
    } else if (e.key === 'Escape') {
      if (shadowRoot) {
        const card = shadowRoot.querySelector('.card-overlay');
        if (card) card.remove();
      }
    }
  });

})();
