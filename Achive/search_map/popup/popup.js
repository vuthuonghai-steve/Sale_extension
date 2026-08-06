document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchBtn = document.getElementById('searchBtn');
  const providerBtns = document.querySelectorAll('.provider-btn');
  const searchSelectionBtn = document.getElementById('searchSelectionBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const statusBadge = document.getElementById('statusBadge');
  const adminResultCard = document.getElementById('adminResultCard');

  let activeProvider = 'gmaps';
  let adminData = null;
  let isComposing = false;

  // Load Admin Data into memory for instant lookup
  try {
    const dataUrl = chrome.runtime.getURL('data/hanoi_admin_data.min.json');
    const res = await fetch(dataUrl);
    adminData = await res.json();
    console.log('[Popup] Loaded admin JSON successfully.');
  } catch (err) {
    console.warn('[Popup] Failed to load admin dataset:', err);
  }

  // Load history from storage on init
  loadHistory();

  // Provider Selection
  providerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      providerBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeProvider = btn.dataset.provider;
    });
  });

  // String Normalization
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

  // Admin Data Lookup Core (< 0.01ms)
  function lookupAdminData(query) {
    if (!adminData || !query) return null;
    const trimmed = query.trim();
    const norm = normalizeText(trimmed);

    if (!norm) return null;

    if (adminData.lookupIndex[trimmed]) return adminData.lookupIndex[trimmed];
    if (adminData.lookupIndex[norm]) return adminData.lookupIndex[norm];

    for (const key in adminData.lookupIndex) {
      if (key.length >= 3 && (norm.includes(key) || key.includes(norm))) {
        return adminData.lookupIndex[key];
      }
    }
    return null;
  }

  // Vietnamese IME Composition Handling
  searchInput.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  searchInput.addEventListener('compositionend', () => {
    isComposing = false;
    const val = searchInput.value.trim();
    clearSearchBtn.style.display = val ? 'block' : 'none';
    checkAndRenderAdminResult(val);
  });

  // Live Input Match Check (Ignored during IME composition)
  searchInput.addEventListener('input', () => {
    if (isComposing) return;
    const val = searchInput.value.trim();
    clearSearchBtn.style.display = val ? 'block' : 'none';
    checkAndRenderAdminResult(val);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    adminResultCard.style.display = 'none';
    searchInput.focus();
  });

  function checkAndRenderAdminResult(query) {
    if (!query) {
      adminResultCard.style.display = 'none';
      return;
    }

    const match = lookupAdminData(query);
    if (match) {
      const { type, data } = match;
      adminResultCard.style.display = 'block';

      if (type === 'street') {
        adminResultCard.innerHTML = `
          <div class="result-badge street" style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);">Đơn vị Hành chính</div>
          <div class="result-title" style="font-size: 18px; font-weight: 800; color: #38bdf8;">${data.districtName}</div>
          <div class="result-sub">Đường / Phố: <strong>${data.streetName}</strong></div>
          <div class="result-sub">Phường / Xã: ${data.wardName}</div>
        `;
      } else if (type === 'ward') {
        adminResultCard.innerHTML = `
          <div class="result-badge ward">${data.wardType}</div>
          <div class="result-title" style="font-size: 18px; font-weight: 800; color: #38bdf8;">${data.districtName}</div>
          <div class="result-sub">Đơn vị Phường / Xã: <strong>${data.fullName}</strong></div>
        `;
      } else if (type === 'district') {
        adminResultCard.innerHTML = `
          <div class="result-badge district">${data.adminType}</div>
          <div class="result-title" style="font-size: 18px; font-weight: 800; color: #38bdf8;">${data.name}</div>
          <div class="result-sub">Diện tích: ${data.area} km² | Dân số: ${data.population} người</div>
          <div class="result-sub">Đơn vị: ${data.subUnitsInfo} (${data.wardCount})</div>
        `;
      }
    } else {
      adminResultCard.style.display = 'none';
    }
  }

  // Search Action
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      executeMapSearch(query);
    } else {
      showStatus('Vui lòng nhập từ khóa!', 'warning');
    }
  });

  // Enter key press in search input
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !isComposing) {
      searchBtn.click();
    }
  });

  // Tool: Search Highlighted/Selected text from page
  searchSelectionBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_SELECTION' });
      if (response && response.text) {
        searchInput.value = response.text;
        clearSearchBtn.style.display = 'block';
        checkAndRenderAdminResult(response.text);
        showStatus('Đã lấy từ khóa bôi đen!', 'success');
      } else {
        showStatus('Chưa bôi đen từ nào!', 'warning');
      }
    } catch (err) {
      console.warn('Cannot get selection:', err);
      showStatus('Chưa bôi đen từ nào!', 'warning');
    }
  });

  // Tool: Copy Current Page URL
  copyUrlBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        await navigator.clipboard.writeText(tab.url);
        showStatus('Đã chép Link!', 'success');
      }
    } catch (err) {
      showStatus('Lỗi chép Link', 'error');
    }
  });

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    chrome.storage.local.set({ searchHistory: [] }, () => {
      renderHistory([]);
      showStatus('Đã xóa lịch sử', 'success');
    });
  });

  // Core Search Function
  function executeMapSearch(query) {
    let url = '';
    const encoded = encodeURIComponent(query);

    switch (activeProvider) {
      case 'osm':
        url = `https://www.openstreetmap.org/search?query=${encoded}`;
        break;
      case 'bing':
        url = `https://www.bing.com/maps?q=${encoded}`;
        break;
      case 'gmaps':
      default:
        url = `https://www.google.com/maps/search/${encoded}`;
        break;
    }

    saveToHistory(query);
    chrome.tabs.create({ url });
  }

  // Storage Helpers
  function saveToHistory(query) {
    chrome.storage.local.get(['searchHistory'], (result) => {
      let history = result.searchHistory || [];
      history = history.filter((item) => item !== query);
      history.unshift(query);
      if (history.length > 10) history.pop();

      chrome.storage.local.set({ searchHistory: history }, () => {
        renderHistory(history);
      });
    });
  }

  function loadHistory() {
    chrome.storage.local.get(['searchHistory'], (result) => {
      renderHistory(result.searchHistory || []);
    });
  }

  function renderHistory(history) {
    historyList.innerHTML = '';

    if (!history || history.length === 0) {
      historyList.innerHTML = '<li class="empty-state">Chưa có lịch sử tìm kiếm</li>';
      return;
    }

    history.forEach((query) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML = `
        <span class="item-text" title="${query}">${query}</span>
        <svg class="search-go-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;
      li.addEventListener('click', () => {
        searchInput.value = query;
        clearSearchBtn.style.display = 'block';
        checkAndRenderAdminResult(query);
      });
      historyList.appendChild(li);
    });
  }

  function showStatus(msg, type = 'info') {
    statusBadge.textContent = msg;
    if (type === 'warning') {
      statusBadge.style.color = '#facc15';
      statusBadge.style.backgroundColor = 'rgba(250, 204, 21, 0.15)';
      statusBadge.style.borderColor = 'rgba(250, 204, 21, 0.3)';
    } else if (type === 'error') {
      statusBadge.style.color = '#f87171';
      statusBadge.style.backgroundColor = 'rgba(248, 113, 113, 0.15)';
      statusBadge.style.borderColor = 'rgba(248, 113, 113, 0.3)';
    } else {
      statusBadge.style.color = '#4ade80';
      statusBadge.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
      statusBadge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    }

    setTimeout(() => {
      statusBadge.textContent = 'Sẵn sàng';
      statusBadge.style.color = '#4ade80';
      statusBadge.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
      statusBadge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    }, 2500);
  }
});
