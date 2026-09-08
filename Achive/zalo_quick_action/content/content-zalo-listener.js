// Content Zalo Listener Module: Listens to App messages on Zalo Web and auto-appends separator
(function () {
  'use strict';

  // In-memory cache of processed message signatures to avoid re-triggering or infinite loops
  const processedSignatures = new Set();
  const MAX_CACHE_SIZE = 100;

  // Active debounce timers per conversation: convKey -> timerId
  const pendingTimers = new Map();

  // Snapshot of last known preview text per conversation to detect ACTUAL CHANGES only: convKey -> previewText
  const lastKnownConvState = new Map();

  // Baseline calibration flag: When true, only new incoming changes trigger actions
  let isBaselineReady = false;

  // Mutex & cooldown state to strictly prevent duplicate separator sends
  let isSendingSeparator = false;
  let lastSeparatorSentTime = 0;
  const SEPARATOR_COOLDOWN_MS = 3000;

  // Counter for generating stable conversation DOM keys
  let convIdCounter = 0;

  // Keep-alive port reference
  let keepAlivePort = null;
  let keepAliveInterval = null;
  let pollingInterval = null;
  let conversationObserver = null;
  let chatViewObserver = null;
  let isInitialized = false;

  window.ZaloQuickActionListener = {
    // Inspection helper for status & testing
    hasPendingTimer(convKey) {
      return pendingTimers.has(convKey);
    },

    _setBaselineReady(ready = true) {
      isBaselineReady = !!ready;
    },

    _resetMutex() {
      isSendingSeparator = false;
      lastSeparatorSentTime = 0;
    },

    // 1. Initialize Listener on Zalo Web
    init() {
      if (isInitialized) return;
      if (!window.ZaloQuickActionDOM || !window.ZaloQuickActionDOM.isZaloWeb()) {
        return;
      }

      isInitialized = true;
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.info('ZaloListener', '🚀 Initializing Zalo App Message Listener & Auto-Separator');
      }

      // Step 1: Baseline snapshot calibration (prevent processing old messages on load)
      this.calibrateBaseline();

      // Step 2: Start Keep-Alive channel with Background Service Worker
      this.initKeepAlive();

      // Step 3: Start observing conversation list (#conversationList)
      this.startConversationObserver();

      // Step 4: Start observing active chat view (#chatView)
      this.startActiveChatViewObserver();

      // Step 5: Start fallback interval scanner (every 1s)
      this.startPollingScanner();
    },

    // Baseline Calibration: Capture existing messages on load so they are NEVER treated as new
    calibrateBaseline() {
      try {
        const convNodes = this.getConversationElements();
        convNodes.forEach((convEl) => {
          const previewEl = convEl.querySelector('.z-conv-message, [class*="conv-message"]') || convEl;
          const fullText = (previewEl.textContent || '').trim();
          const convKey = this.extractConversationKey(convEl);
          lastKnownConvState.set(convKey, fullText);
        });

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('ZaloListener', `📸 Captured baseline snapshot of ${lastKnownConvState.size} existing conversations.`);
        }
      } catch (e) {
        // Safe baseline capture
      }

      // Mark baseline ready after 1.2s to ignore initial load/render mutations
      setTimeout(() => {
        isBaselineReady = true;
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloListener', '🎯 Baseline calibration complete. Extension is actively listening for REAL NEW messages from App!');
        }
      }, 1200);
    },

    // 2. Keep-Alive Mechanism for Chrome Manifest V3
    initKeepAlive() {
      const connectPort = () => {
        try {
          if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;

          keepAlivePort = chrome.runtime.connect({ name: 'zalo-keepalive' });

          keepAlivePort.onMessage.addListener((msg) => {
            if (msg && msg.type === 'PONG') {
              // Heartbeat acknowledged
            }
          });

          keepAlivePort.onDisconnect.addListener(() => {
            keepAlivePort = null;
            setTimeout(connectPort, 3000);
          });
        } catch (e) {
          keepAlivePort = null;
        }
      };

      connectPort();

      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (keepAlivePort) {
          try {
            keepAlivePort.postMessage({ type: 'PING', time: Date.now() });
          } catch (err) {
            keepAlivePort = null;
            connectPort();
          }
        } else {
          connectPort();
        }
      }, 20000);
    },

    // 3. Conversation List Observer (#conversationList)
    startConversationObserver() {
      const attachObserver = () => {
        const convListContainer = document.querySelector('#conversationList') ||
                                  document.querySelector('#sidebarNav') ||
                                  document.querySelector('.conv-list');

        if (!convListContainer) {
          setTimeout(attachObserver, 500);
          return;
        }

        if (conversationObserver) {
          conversationObserver.disconnect();
        }

        conversationObserver = new MutationObserver(() => {
          this.scanRecentConversations();
        });

        conversationObserver.observe(convListContainer, {
          childList: true,
          subtree: true,
          characterData: true
        });

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloListener', '✅ Attached MutationObserver to conversation list');
        }
      };

      attachObserver();
    },

    // 4. Active Chat View Observer (#chatView / messages area)
    startActiveChatViewObserver() {
      const attachChatObserver = () => {
        const chatView = document.querySelector('#chatView') ||
                         document.querySelector('.chat-view') ||
                         document.querySelector('#messageView') ||
                         document.querySelector('.message-view__body');

        if (!chatView) {
          setTimeout(attachChatObserver, 1000);
          return;
        }

        if (chatViewObserver) {
          chatViewObserver.disconnect();
        }

        chatViewObserver = new MutationObserver(() => {
          this.inspectActiveChatView();
        });

        chatViewObserver.observe(chatView, {
          childList: true,
          subtree: true,
          characterData: true
        });

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloListener', '✅ Attached MutationObserver to active chat view');
        }
      };

      attachChatObserver();
    },

    // 5. Fallback Polling Scanner
    startPollingScanner() {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        this.scanRecentConversations();
        this.inspectActiveChatView();
      }, 1000);
    },

    // 6. Scan Top / Recent Conversations for REAL NEW Messages from "Bạn"
    scanRecentConversations() {
      const isEnabled = window.ZaloQuickActionConfig 
        ? window.ZaloQuickActionConfig.get('autoSeparatorEnabled') !== false 
        : true;

      if (!isEnabled) return;

      const convNodes = this.getConversationElements();
      if (!convNodes || convNodes.length === 0) return;

      // Inspect top 5 most recent conversations
      const topConvs = convNodes.slice(0, 5);
      topConvs.forEach((convEl) => {
        this.inspectConversationElement(convEl);
      });
    },

    // Locate conversation list items in Zalo Web DOM
    getConversationElements() {
      const convList = document.querySelector('#conversationList');
      if (!convList) return [];

      // 1. Target direct items or standard conv item classes
      let items = Array.from(convList.querySelectorAll('div.conv-item, [class*="conv-item"], div[role="listitem"], [data-id*="conv"]'));
      
      // 2. Fallback heuristic: children containing .z-conv-message
      if (items.length === 0) {
        const candidateContainers = Array.from(convList.querySelectorAll('div.w100, div[tabindex], div.z-conv-item, div'));
        items = candidateContainers.filter(el => {
          return el.querySelector('.z-conv-message, [class*="conv-message"]') && el.offsetWidth > 0;
        });
      }

      return items;
    },

    // Helper: Determine if text contains a separator (/={5,}/)
    isSeparatorMessage(text) {
      if (!text) return false;
      return /={5,}/.test(text);
    },

    // Helper: Cancel all pending separator timers (e.g. when image/sticker arrives in chat)
    cancelAllPendingTimers(reason) {
      if (pendingTimers.size === 0) return;
      for (const [key, timerId] of pendingTimers.entries()) {
        clearTimeout(timerId);
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('ZaloListener', `🛑 Cancelled auto-separator timer for "${key}" (Reason: ${reason})`);
        }
      }
      pendingTimers.clear();
    },

    // Inspect an individual conversation element (Single Source of Truth for scheduling)
    inspectConversationElement(convEl) {
      if (!convEl || !convEl.isConnected) return;

      const previewEl = convEl.querySelector('.z-conv-message, [class*="conv-message"]') || convEl;
      const fullPreviewText = (previewEl.textContent || '').trim();
      if (!fullPreviewText) return;

      const convKey = this.extractConversationKey(convEl);

      // --- CRITICAL CHECK: BASELINE & CHANGE DETECTION ---
      if (!isBaselineReady) {
        // Record baseline state during initial page load, DO NOT trigger actions
        lastKnownConvState.set(convKey, fullPreviewText);
        return;
      }

      const previousState = lastKnownConvState.get(convKey);
      if (previousState === fullPreviewText) {
        // Conversation has NOT changed (old message). Skip completely!
        return;
      }

      // State changed -> Update last known state immediately
      lastKnownConvState.set(convKey, fullPreviewText);

      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.info('ZaloListener', `🔔 Detected change in conversation "${convKey}": "${fullPreviewText.substring(0, 50)}"`);
      }

      // 1. If message already contains separator (/={5,}/), ignore to avoid infinite loop
      if (this.isSeparatorMessage(fullPreviewText)) {
        const sig = `${convKey}::SEPARATOR::${fullPreviewText}`;
        this.recordProcessedSignature(sig);
        return;
      }

      // Parse whether the latest message was sent by "Bạn" (Current User from App / Web)
      const parseResult = this.parseMyMessage(previewEl, fullPreviewText);
      if (!parseResult.isFromMe) {
        return;
      }

      if (this.isSeparatorMessage(parseResult.content)) {
        const sig = `${convKey}::SEPARATOR::${fullPreviewText}`;
        this.recordProcessedSignature(sig);
        return;
      }

      const messageSig = `${convKey}::${parseResult.type}::${parseResult.content}`;

      // 2. Case: Message is an IMAGE or STICKER -> CANCEL auto-separator timer immediately!
      if (parseResult.type === 'IMAGE' || parseResult.type === 'STICKER') {
        if (pendingTimers.has(convKey)) {
          clearTimeout(pendingTimers.get(convKey));
          pendingTimers.delete(convKey);

          const label = parseResult.type === 'IMAGE' ? 'ảnh' : 'nhãn dán/sticker';
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.info('ZaloListener', `🛑 Detected ${parseResult.type} message after text. Cancelled auto-separator timer.`, {
              convKey,
              preview: fullPreviewText
            });
          }

          if (window.ZaloQuickActionUI && window.ZaloQuickActionConfig?.get('toastEnabled')) {
            window.ZaloQuickActionUI.showToast(`📷 Đã nhận ${label} sau tin nhắn: Bỏ qua gửi phân cách!`);
          }
        }

        this.recordProcessedSignature(messageSig);
        return;
      }

      // 3. Case: Message is TEXT ("Bạn: <văn bản>") -> Schedule countdown timer
      if (parseResult.type === 'TEXT') {
        if (processedSignatures.has(messageSig)) {
          return;
        }

        if (pendingTimers.has(convKey)) {
          clearTimeout(pendingTimers.get(convKey));
          pendingTimers.delete(convKey);
        }

        const delaySeconds = window.ZaloQuickActionConfig 
          ? (parseInt(window.ZaloQuickActionConfig.get('autoSeparatorDelay'), 10) || 3)
          : 3;

        const separatorText = window.ZaloQuickActionConfig 
          ? (window.ZaloQuickActionConfig.get('autoSeparatorText') || '=================================')
          : '=================================';

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('ZaloListener', `⏳ New text message from App detected: "${parseResult.content.substring(0, 30)}...". Starting ${delaySeconds}s countdown timer...`, {
            convKey
          });
        }

        const timerId = setTimeout(async () => {
          pendingTimers.delete(convKey);
          this.recordProcessedSignature(messageSig);

          await this.executeAutoSendSeparator(convEl, separatorText, convKey);
        }, delaySeconds * 1000);

        pendingTimers.set(convKey, timerId);
      }
    },

    // 7. Inspect Active Chat View (#chatView) for real-time messages when chat is currently open
    // Single Source of Truth rule: scanRecentConversations is the sole scheduler.
    // inspectActiveChatView acts as observer & cancellation guard when IMAGE, STICKER or SEPARATOR arrives in active chat.
    inspectActiveChatView() {
      if (!isBaselineReady) return;

      const isEnabled = window.ZaloQuickActionConfig 
        ? window.ZaloQuickActionConfig.get('autoSeparatorEnabled') !== false 
        : true;
      if (!isEnabled) return;

      // Find all message items in the current chat view
      const msgItems = Array.from(document.querySelectorAll('.msg-item, [class*="msg-item"], [data-id*="msg"], div[role="row"]'));
      if (msgItems.length === 0) return;

      const lastMsgEl = msgItems[msgItems.length - 1];
      if (!lastMsgEl || !lastMsgEl.isConnected) return;

      // Check if the last message is sent by current user (outbound message)
      const isOutbound = lastMsgEl.classList.contains('me') ||
                         !!lastMsgEl.querySelector('.me, [class*="--me"], [class*="msg-out"], [class*="bubble-right"]') ||
                         lastMsgEl.getAttribute('data-sender') === 'me' ||
                         lastMsgEl.style.justifyContent === 'flex-end' ||
                         (lastMsgEl.parentElement && (lastMsgEl.parentElement.classList.contains('me') || lastMsgEl.parentElement.style.justifyContent === 'flex-end'));

      if (!isOutbound) return;

      const msgText = (lastMsgEl.textContent || '').trim();

      // If separator already present at bottom of active chat, cancel any pending timers to avoid duplicate
      if (this.isSeparatorMessage(msgText)) {
        this.cancelAllPendingTimers('Separator already present at bottom of active chat');
        return;
      }

      // Check if last message is an IMAGE
      // (1) Text indicator: "Hình ảnh", "3 hình ảnh", "[Hình ảnh]", etc.
      // (2) If no text content: check for real photo/image attachment bubble (exclude contact avatar and emojis)
      const isImageText = /^(?:\[\s*)?(?:\d+\s+)?(?:hình\s*ảnh|hình|ảnh|photo|image)s?(?:\s*\])?[\s.]*$/iu.test(msgText) ||
                          /^\[\s*(?:\d+\s+)?(?:hình\s*ảnh|hình|ảnh|photo|image)s?\s*\]$/iu.test(msgText);

      const hasImageBubble = !msgText && !!lastMsgEl.querySelector(
        '.photo-bubble, .image-bubble, [class*="photo-item"], [class*="image-item"], [data-id*="photo"], [data-id*="image"], .fa-icon-outline-picture, img:not([class*="avatar"]):not([class*="zl-avatar"]):not([class*="zavatar"]):not([class*="emoji"]):not([class*="reaction"])'
      );

      const isImage = isImageText || hasImageBubble;

      // Check if last message is a STICKER
      // (1) Text indicator: "Nhãn dán", "Sticker", "Biểu cảm", "[Nhãn dán]", etc.
      // (2) If no text content: check for sticker bubble
      const isStickerText = /^(?:\[\s*)?(?:\d+\s+)?(?:nhãn\s*dán(?:\s*động)?|sticker|biểu\s*cảm)s?(?:\s*\])?[\s.]*$/iu.test(msgText) ||
                            /^\[\s*(?:nhãn\s*dán(?:\s*động)?|sticker|biểu\s*cảm)s?\s*\]$/iu.test(msgText);

      const hasStickerBubble = !msgText && !!lastMsgEl.querySelector(
        '.sticker-bubble, [class*="sticker-item"], [data-id*="sticker"], .fa-icon-outline-sticker'
      );

      const isSticker = isStickerText || hasStickerBubble;

      if (isImage || isSticker) {
        if (pendingTimers.size > 0) {
          const label = isImage ? 'IMAGE' : 'STICKER';
          this.cancelAllPendingTimers(`Active chat detected ${label}`);

          if (window.ZaloQuickActionUI && window.ZaloQuickActionConfig?.get('toastEnabled')) {
            const toastLabel = isImage ? 'ảnh' : 'nhãn dán/sticker';
            window.ZaloQuickActionUI.showToast(`📷 Đã nhận ${toastLabel} trong cuộc trò chuyện: Bỏ qua gửi phân cách!`);
          }
        }
      }
    },

    // 8. Parse whether the preview message is from "Bạn" and its type (TEXT, IMAGE, or STICKER)
    parseMyMessage(previewEl, text) {
      if (!text) return { isFromMe: false };

      // Pattern: optional leading symbols (↳, ↵, whitespace, brackets, emoji arrows), then sender name, then colon
      const senderMatch = text.match(/^(?:[\s↳↵»>►•–—\-]|\[[^\]]*\])*([^:\n]{1,50}):\s*([\s\S]*)$/u);

      if (senderMatch) {
        const senderName = senderMatch[1].trim();
        const rawContent = senderMatch[2].trim();

        // Check if the sender is current user ("Bạn" or "You")
        if (/^(?:Bạn|You)$/i.test(senderName)) {
          return this.categorizeContent(previewEl, rawContent);
        }

        // Definitely someone else (e.g. "Linh Nguyễn:", "Khách Hàng:")
        return { isFromMe: false };
      }

      // Fallback: Check if the first child element at the very beginning of previewEl contains the sender label
      if (previewEl && previewEl.firstElementChild) {
        const firstText = (previewEl.firstElementChild.textContent || '').trim();
        if (/^(?:[\s↳↵»>►•–—\-]|\[[^\]]*\])*(?:Bạn|You):?$/iu.test(firstText) && /^(?:[\s↳↵»>►•–—\-]|\[[^\]]*\])*(?:Bạn|You):?\s*/iu.test(text)) {
          const fullContent = text.replace(/^(?:[\s↳↵»>►•–—\-]|\[[^\]]*\])*(?:Bạn|You):?\s*/iu, '').trim();
          return this.categorizeContent(previewEl, fullContent);
        }
      }

      // If no "Bạn:" or "You:" indicator at start -> not from me
      return { isFromMe: false };
    },

    // Categorize content into IMAGE, STICKER, or TEXT
    categorizeContent(previewEl, content) {
      const trimmedContent = (content || '').trim();

      // 1. IMAGE DETECTION:
      // - Icon: .fa-icon-outline-picture, .fa-image, .fa-camera, i.fa-*, or [data-icon*="picture"]
      // Target <i> tags or specific icon classes, avoid broad [class*="image"] which matches contact avatar wrappers
      const hasImageIcon = !!(previewEl && previewEl.querySelector && (
        previewEl.querySelector('.fa-icon-outline-picture, .fa-image, .fa-camera, [data-icon*="image"], [data-icon*="picture"], i[class*="picture"], i[class*="photo"], i[class*="image"], i[class*="camera"]')
      ));

      // Bare text: "Hình ảnh", "3 hình ảnh", "ảnh", "photo", "image" or bracketed "[Hình ảnh]", "[3 hình ảnh]"
      const isImageText = /^(?:\[\s*)?(?:\d+\s+)?(?:hình\s*ảnh|hình|ảnh|photo|image)s?(?:\s*\])?(?:\s*(?:\[\s*)?\d+\s+(?:hình\s*ảnh|hình|ảnh|photo|image)s?(?:\s*\])?)?[\s.]*$/iu.test(trimmedContent) ||
                          /^\[\s*(?:\d+\s+)?(?:hình\s*ảnh|hình|ảnh|photo|image)s?\s*\]$/iu.test(trimmedContent);

      const isImage = isImageText || (hasImageIcon && (!trimmedContent || isImageText));

      if (isImage) {
        return {
          isFromMe: true,
          type: 'IMAGE',
          content
        };
      }

      // 2. STICKER DETECTION:
      // - Icon: .fa-icon-outline-sticker, .fa-sticker, [data-icon*="sticker"], i[class*="sticker"]
      // NOTE: Strictly exclude inline text emoji classes (.emoji, .fa-smile) to preserve BDS text messages containing emojis
      const hasStickerIcon = !!(previewEl && previewEl.querySelector && (
        previewEl.querySelector('.fa-icon-outline-sticker, .fa-sticker, [data-icon*="sticker"], i[class*="sticker"]')
      ));

      // Bare text: "Nhãn dán", "Sticker", "Biểu cảm", "Nhãn dán động" or bracketed "[Nhãn dán]", "[Sticker]"
      const isStickerText = /^(?:\[\s*)?(?:\d+\s+)?(?:nhãn\s*dán(?:\s*động)?|sticker|biểu\s*cảm)s?(?:\s*\])?[\s.]*$/iu.test(trimmedContent) ||
                            /^\[\s*(?:nhãn\s*dán(?:\s*động)?|sticker|biểu\s*cảm)s?\s*\]$/iu.test(trimmedContent);

      const isSticker = isStickerText || (hasStickerIcon && (!trimmedContent || isStickerText));

      if (isSticker) {
        return {
          isFromMe: true,
          type: 'STICKER',
          content
        };
      }

      // 3. TEXT:
      return {
        isFromMe: true,
        type: 'TEXT',
        content
      };
    },

    // Extract unique identifier for a conversation DOM element
    // NEVER uses previewText to prevent key mutation when message type changes (e.g. text -> image)
    extractConversationKey(convEl) {
      if (!convEl) return 'conv_unknown';

      // 1. Direct data attributes from Zalo DOM
      const attrId = convEl.getAttribute('data-id') ||
                     convEl.getAttribute('data-cid') ||
                     convEl.getAttribute('data-uid') ||
                     convEl.getAttribute('id');
      if (attrId) return 'id_' + attrId;

      // 2. Persistent dataset ID assigned to this DOM node
      if (convEl.dataset && convEl.dataset.zalolistenerId) {
        return convEl.dataset.zalolistenerId;
      }

      // 3. Conversation title / contact name (stable across message updates)
      // Strictly exclude elements that contain the preview message text, timestamp, or unread counter
      const titleEl = convEl.querySelector('.conv-item-title, .z-conv-title, .conv-title, [class*="conv-item__name"], [class*="conv-name"], [class*="title"]:not([class*="message"]):not([class*="preview"]):not([class*="time"])');
      const title = titleEl?.textContent?.trim() || 
                    convEl.querySelector('[title]:not([class*="message"]):not([class*="preview"]):not([class*="time"])')?.getAttribute('title')?.trim();
      if (title) {
        const convKey = 'name_' + title;
        if (convEl.dataset) convEl.dataset.zalolistenerId = convKey;
        return convKey;
      }

      // 4. Stable generated ID stored on DOM node dataset (never based on message content)
      convIdCounter += 1;
      const stableKey = 'conv_node_' + convIdCounter;
      if (convEl.dataset) {
        convEl.dataset.zalolistenerId = stableKey;
      }
      return stableKey;
    },

    // Helper: Find conversation element by stable convKey if DOM was recycled
    findConversationElementByKey(convKey) {
      if (!convKey) return null;
      const convNodes = this.getConversationElements();
      for (const node of convNodes) {
        if (this.extractConversationKey(node) === convKey) {
          return node;
        }
      }
      return null;
    },

    // Record processed message in LRU cache
    recordProcessedSignature(sig) {
      if (processedSignatures.size >= MAX_CACHE_SIZE) {
        const oldest = processedSignatures.values().next().value;
        processedSignatures.delete(oldest);
      }
      processedSignatures.add(sig);
    },

    // 9. Execute Auto-Send Separator into Chat with Mutex & Cooldown Protection
    async executeAutoSendSeparator(convEl, separatorText, convKey) {
      const now = Date.now();
      if (isSendingSeparator) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.warn('ZaloListener', '🔒 Mutex active: Separator send already in progress. Skipping duplicate execution.');
        }
        return;
      }

      if (now - lastSeparatorSentTime < SEPARATOR_COOLDOWN_MS) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.warn('ZaloListener', `⏳ Cooldown active: Separator was sent recently (${now - lastSeparatorSentTime}ms ago < ${SEPARATOR_COOLDOWN_MS}ms). Skipping.`);
        }
        return;
      }

      isSendingSeparator = true;
      try {
        const DOM = window.ZaloQuickActionDOM;
        const Adapter = window.ZaloQuickActionAdapter;

        if (!DOM || !Adapter) return;

        // Re-acquire fresh conversation element if node was disconnected during debounce delay
        if ((!convEl || !convEl.isConnected) && convKey) {
          convEl = this.findConversationElementByKey(convKey);
        }

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('ZaloListener', '🚀 Timeout elapsed without image/sticker. Sending separator message...', { separatorText, convKey });
        }

        // Step 1: If convEl is specified and not already active, click it
        if (convEl && convEl.isConnected) {
          DOM.simulateClick(convEl);
          await new Promise(r => setTimeout(r, 650));
        }

        // Double check chat view before actually sending: Has a separator arrived in the meantime?
        const lastMsgEl = document.querySelector('#chatView .msg-item:last-child, .chat-view [class*="msg-item"]:last-child');
        if (lastMsgEl) {
          const lastText = (lastMsgEl.textContent || '').trim();
          if (this.isSeparatorMessage(lastText)) {
            if (window.ZaloQuickActionLogger) {
              window.ZaloQuickActionLogger.info('ZaloListener', '🛑 Separator already present at end of chat view. Skipping send.');
            }
            return;
          }
        }

        // Step 2: Send separator message via Adapter into #richInput
        const success = await Adapter.sendChatMessage(separatorText);

        if (success) {
          lastSeparatorSentTime = Date.now();
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.success('ZaloListener', '🎉 Successfully sent auto-separator message after App text');
          }

          const toastEnabled = window.ZaloQuickActionConfig 
            ? window.ZaloQuickActionConfig.get('toastEnabled') !== false 
            : true;

          if (toastEnabled && window.ZaloQuickActionUI) {
            window.ZaloQuickActionUI.showToast('🚀 Đã tự động gửi phân cách sau tin nhắn từ App!');
          }
        } else {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.warn('ZaloListener', '⚠️ Could not send separator message into chat');
          }
        }
      } catch (err) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.error('ZaloListener', 'Error during executeAutoSendSeparator', err);
        }
      } finally {
        // Hold mutex for 1.5s post-send to allow DOM to settle and avoid race conditions
        setTimeout(() => {
          isSendingSeparator = false;
        }, 1500);
      }
    }
  };
})();
