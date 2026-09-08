/**
 * Unit Test Suite for content-zalo-listener.js
 * Tests Image & Sticker detection, sender checking, stable convKey, separator regex, and cancellation
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function createMockElement(options = {}) {
  const classSet = new Set(options.classes || []);
  classSet.contains = (c) => classSet.has(c);
  classSet.add = (c) => Set.prototype.add.call(classSet, c);
  classSet.remove = (c) => classSet.delete(c);

  const el = {
    tagName: options.tagName || 'DIV',
    classList: classSet,
    attributes: new Map(Object.entries(options.attributes || {})),
    children: [],
    parentElement: null,
    isConnected: options.isConnected !== undefined ? options.isConnected : true,
    offsetWidth: options.offsetWidth !== undefined ? options.offsetWidth : 100,
    offsetHeight: options.offsetHeight !== undefined ? options.offsetHeight : 30,
    dataset: { ...(options.dataset || {}) },
    style: {},
    textContent: options.textContent || ''
  };

  el.getAttribute = (name) => el.attributes.get(name) || null;
  el.setAttribute = (name, val) => el.attributes.set(name, val);
  el.querySelector = (sel) => {
    for (const child of el.children) {
      if (matchesSel(child, sel)) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    return null;
  };
  el.querySelectorAll = (sel) => {
    const list = [];
    for (const child of el.children) {
      if (matchesSel(child, sel)) list.push(child);
      list.push(...child.querySelectorAll(sel));
    }
    return list;
  };

  return el;
}

function matchesSel(el, sel) {
  const parts = sel.split(',').map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith('.')) {
      const cls = p.slice(1);
      if (el.classList.has(cls)) return true;
    }
    if (p.includes('[class*="')) {
      const match = p.match(/\[class\*="([^"]+)"\]/);
      if (match) {
        for (const c of el.classList) {
          if (c.includes(match[1])) return true;
        }
      }
    }
    if (p === 'i' && el.tagName === 'I') return true;
    if (p === 'span' && el.tagName === 'SPAN') return true;
    if (p === 'div' && el.tagName === 'DIV') return true;
  }
  return false;
}

async function runListenerTests() {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  🧪 ZALO LISTENER & AUTO-SEPARATOR TEST SUITE  🧪${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);

  // Setup VM sandbox
  const sandbox = {
    window: {},
    globalThis: {},
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    Promise: Promise
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  // Mock DOM
  sandbox.window.document = {
    querySelector: () => null,
    querySelectorAll: () => []
  };
  sandbox.window.ZaloQuickActionDOM = {
    isZaloWeb: () => true,
    simulateClick: () => {}
  };
  sandbox.window.ZaloQuickActionConfig = {
    get: (key) => {
      if (key === 'autoSeparatorEnabled') return true;
      if (key === 'autoSeparatorText') return '=================================';
      if (key === 'autoSeparatorDelay') return 1;
      return null;
    }
  };
  sandbox.window.ZaloQuickActionLogger = {
    info: () => {},
    success: () => {},
    warn: () => {},
    error: () => {}
  };
  sandbox.window.ZaloQuickActionAdapter = {
    sendChatMessage: async () => true
  };

  vm.createContext(sandbox);

  const listenerPath = path.resolve(__dirname, '../content/content-zalo-listener.js');
  const listenerCode = fs.readFileSync(listenerPath, 'utf8');
  vm.runInContext(listenerCode, sandbox);

  const Listener = sandbox.window.ZaloQuickActionListener;
  assert(Listener, 'ZaloQuickActionListener must exist');

  let passed = 0;
  let failed = 0;

  function it(name, fn) {
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        return res.then(() => {
          passed++;
          console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${name}`);
        }).catch((err) => {
          failed++;
          console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${name}`);
          console.log(`    ${colors.red}${err.message}${colors.reset}`);
        });
      }
      passed++;
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${name}`);
    } catch (err) {
      failed++;
      console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${name}`);
      console.log(`    ${colors.red}${err.message}${colors.reset}`);
    }
  }

  // Group 1: Separator Regex Recognition
  console.log(`${colors.bright}1. Separator Detection (/={5,}/)${colors.reset}`);
  it('Should recognize standard 33 "=" separator', () => {
    assert.strictEqual(Listener.isSeparatorMessage('================================='), true);
  });
  it('Should recognize truncated 20 "=" preview from Zalo Web', () => {
    assert.strictEqual(Listener.isSeparatorMessage('===================='), true);
  });
  it('Should recognize minimum 5 "=" separator', () => {
    assert.strictEqual(Listener.isSeparatorMessage('====='), true);
  });
  it('Should recognize separator within message preview', () => {
    assert.strictEqual(Listener.isSeparatorMessage('Bạn: ===================='), true);
  });
  it('Should NOT treat normal text as separator', () => {
    assert.strictEqual(Listener.isSeparatorMessage('Mã: 🏆 334 Phòng đẹp 5tr'), false);
  });
  it('Should NOT treat 4 "=" as separator', () => {
    assert.strictEqual(Listener.isSeparatorMessage('===='), false);
  });

  // Group 2: Sender Verification ("Bạn:" / "You:" vs Others)
  console.log(`\n${colors.bright}2. Sender Verification${colors.reset}`);
  it('Should recognize "Bạn: ..." as from me', () => {
    const el = createMockElement({ textContent: 'Bạn: Mã 01' });
    const res = Listener.parseMyMessage(el, 'Bạn: Mã 01');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'TEXT');
    assert.strictEqual(res.content, 'Mã 01');
  });

  it('Should recognize "↳ Bạn: ..." with reply arrow as from me', () => {
    const el = createMockElement({ textContent: '↳ Bạn: Mã 02' });
    const res = Listener.parseMyMessage(el, '↳ Bạn: Mã 02');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.content, 'Mã 02');
  });

  it('Should recognize "You: ..." as from me', () => {
    const el = createMockElement({ textContent: 'You: Mã 03' });
    const res = Listener.parseMyMessage(el, 'You: Mã 03');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.content, 'Mã 03');
  });

  it('Should REJECT messages from other people ("Linh Nguyễn: ...")', () => {
    const el = createMockElement({ textContent: 'Linh Nguyễn: Mã 01' });
    const res = Listener.parseMyMessage(el, 'Linh Nguyễn: Mã 01');
    assert.strictEqual(res.isFromMe, false);
  });

  it('Should REJECT messages from other people even if containing word "Bạn" in sentence', () => {
    const el = createMockElement({ textContent: 'Linh Nguyễn: Bạn ơi phòng còn không?' });
    const res = Listener.parseMyMessage(el, 'Linh Nguyễn: Bạn ơi phòng còn không?');
    assert.strictEqual(res.isFromMe, false);
  });

  it('Should REJECT messages without sender prefix (incoming 1-1 chat)', () => {
    const el = createMockElement({ textContent: 'Phòng còn không em?' });
    const res = Listener.parseMyMessage(el, 'Phòng còn không em?');
    assert.strictEqual(res.isFromMe, false);
  });

  it('Should REJECT incoming customer message with word "Bạn" in an inner span', () => {
    const el = createMockElement({ textContent: 'Chào Bạn đẹp quá' });
    el.children.push(createMockElement({ tagName: 'SPAN', textContent: 'Chào ' }));
    el.children.push(createMockElement({ tagName: 'SPAN', textContent: 'Bạn' }));
    el.children.push(createMockElement({ tagName: 'SPAN', textContent: ' đẹp quá' }));
    const res = Listener.parseMyMessage(el, 'Chào Bạn đẹp quá');
    assert.strictEqual(res.isFromMe, false, 'Should not treat inner span with word Bạn as from me');
  });

  // Group 3: Image & Sticker Detection
  console.log(`\n${colors.bright}3. Image & Sticker Detection${colors.reset}`);
  it('Should classify <i class="fa fa-icon-outline-picture"></i> + "Hình ảnh" as IMAGE', () => {
    const el = createMockElement({ textContent: 'Bạn: Hình ảnh' });
    const icon = createMockElement({ tagName: 'I', classes: ['fa', 'fa-icon-outline-picture'] });
    el.children.push(icon);

    const res = Listener.parseMyMessage(el, 'Bạn: Hình ảnh');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify bare text "3 hình ảnh" as IMAGE without icon or brackets', () => {
    const el = createMockElement({ textContent: 'Bạn: 3 hình ảnh' });
    const res = Listener.parseMyMessage(el, 'Bạn: 3 hình ảnh');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify bare text "Hình ảnh" as IMAGE', () => {
    const el = createMockElement({ textContent: 'Bạn: Hình ảnh' });
    const res = Listener.parseMyMessage(el, 'Bạn: Hình ảnh');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify bracketed "[Hình ảnh]" as IMAGE', () => {
    const el = createMockElement({ textContent: 'Bạn: [Hình ảnh]' });
    const res = Listener.parseMyMessage(el, 'Bạn: [Hình ảnh]');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify bracketed "[3 hình ảnh]" as IMAGE', () => {
    const el = createMockElement({ textContent: 'Bạn: [3 hình ảnh]' });
    const res = Listener.parseMyMessage(el, 'Bạn: [3 hình ảnh]');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify bare text "Sticker" as STICKER', () => {
    const el = createMockElement({ textContent: 'Bạn: Sticker' });
    const res = Listener.parseMyMessage(el, 'Bạn: Sticker');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'STICKER');
  });

  it('Should classify bare text "Nhãn dán" as STICKER', () => {
    const el = createMockElement({ textContent: 'Bạn: Nhãn dán' });
    const res = Listener.parseMyMessage(el, 'Bạn: Nhãn dán');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'STICKER');
  });

  it('Should classify bracketed "[Nhãn dán]" as STICKER', () => {
    const el = createMockElement({ textContent: 'Bạn: [Nhãn dán]' });
    const res = Listener.parseMyMessage(el, 'Bạn: [Nhãn dán]');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'STICKER');
  });

  it('Should classify <i class="fa fa-icon-outline-sticker"></i> as STICKER', () => {
    const el = createMockElement({ textContent: 'Bạn: [Nhãn dán]' });
    const icon = createMockElement({ tagName: 'I', classes: ['fa', 'fa-icon-outline-sticker'] });
    el.children.push(icon);

    const res = Listener.parseMyMessage(el, 'Bạn: [Nhãn dán]');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'STICKER');
  });

  it('Should classify normal text containing "hình ảnh" in sentence as TEXT (not IMAGE)', () => {
    const el = createMockElement({ textContent: 'Bạn: Phòng trọ có hình ảnh đầy đủ như thực tế' });
    const res = Listener.parseMyMessage(el, 'Bạn: Phòng trọ có hình ảnh đầy đủ như thực tế');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'TEXT');
  });

  it('Should classify BDS text containing emoji 🏆 and .emoji class as TEXT (not STICKER)', () => {
    const el = createMockElement({ textContent: 'Bạn: 🏆 032 Phòng đẹp 🌷40%-12m' });
    const emojiSpan = createMockElement({ tagName: 'SPAN', classes: ['emoji'], textContent: '🏆' });
    el.children.push(emojiSpan);
    const res = Listener.parseMyMessage(el, 'Bạn: 🏆 032 Phòng đẹp 🌷40%-12m');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'TEXT', 'Emojis in text listings must NEVER be classified as STICKER');
  });

  it('Should classify BDS text message with avatar/image wrapper class as TEXT (not IMAGE)', () => {
    const el = createMockElement({ textContent: 'Bạn: Phòng 5tr Cầu Giấy' });
    const avatarWrapper = createMockElement({ classes: ['avatar-image'], textContent: '' });
    el.children.push(avatarWrapper);
    const res = Listener.parseMyMessage(el, 'Bạn: Phòng 5tr Cầu Giấy');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'TEXT', 'Avatar or container image class must not turn text message into IMAGE');
  });

  it('Should classify empty content with <i class="fa fa-icon-outline-picture"></i> as IMAGE', () => {
    const el = createMockElement({ textContent: 'Bạn: ' });
    const icon = createMockElement({ tagName: 'I', classes: ['fa', 'fa-icon-outline-picture'] });
    el.children.push(icon);
    const res = Listener.parseMyMessage(el, 'Bạn: ');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'IMAGE');
  });

  it('Should classify empty content with <i class="fa fa-icon-outline-sticker"></i> as STICKER', () => {
    const el = createMockElement({ textContent: 'Bạn: ' });
    const icon = createMockElement({ tagName: 'I', classes: ['fa', 'fa-icon-outline-sticker'] });
    el.children.push(icon);
    const res = Listener.parseMyMessage(el, 'Bạn: ');
    assert.strictEqual(res.isFromMe, true);
    assert.strictEqual(res.type, 'STICKER');
  });

  // Group 4: Stable Conversation Key (No Key Mutation on Message Change)
  console.log(`\n${colors.bright}4. Stable extractConversationKey${colors.reset}`);
  it('Should generate consistent key for conversation across text and image preview changes', () => {
    const convEl = createMockElement({
      attributes: { 'data-id': 'conv_user_12345' }
    });

    const key1 = Listener.extractConversationKey(convEl);
    const key2 = Listener.extractConversationKey(convEl);
    assert.strictEqual(key1, 'id_conv_user_12345');
    assert.strictEqual(key1, key2);
  });

  it('Should extract stable key from conversation title without using preview message text', () => {
    const convEl = createMockElement({});
    const titleEl = createMockElement({ classes: ['conv-item-title'], textContent: 'Khách VIP Hà Nội' });
    convEl.children.push(titleEl);

    const key = Listener.extractConversationKey(convEl);
    assert.strictEqual(key, 'name_Khách VIP Hà Nội');

    // Add preview message child later
    const msgEl = createMockElement({ classes: ['z-conv-message'], textContent: 'Bạn: 3 hình ảnh' });
    convEl.children.push(msgEl);

    const keyAfterMsg = Listener.extractConversationKey(convEl);
    assert.strictEqual(keyAfterMsg, 'name_Khách VIP Hà Nội');
  });

  it('Should maintain stable key on DOM dataset even if title is absent', () => {
    const convEl = createMockElement({});
    const key1 = Listener.extractConversationKey(convEl);
    const key2 = Listener.extractConversationKey(convEl);
    assert(key1.startsWith('conv_node_'));
    assert.strictEqual(key1, key2, 'Key must be stable across multiple calls on the same node');
  });

  // Group 5: Cancellation on Image / Sticker Arrival
  console.log(`\n${colors.bright}5. Timer Cancellation on Image/Sticker${colors.reset}`);
  it('Should cancel pending separator timer when IMAGE arrives for conversation', () => {
    // Setup baseline ready
    Listener._setBaselineReady(true);

    const convEl = createMockElement({ attributes: { 'data-id': 'conv_cancel_test_1' } });
    const previewEl = createMockElement({ classes: ['z-conv-message'], textContent: 'Bạn: Cần thuê căn hộ 1PN' });
    convEl.children.push(previewEl);

    // First: text message arrives -> schedules timer
    Listener.inspectConversationElement(convEl);
    const hasTimerInitially = Listener.hasPendingTimer('id_conv_cancel_test_1');
    assert.strictEqual(hasTimerInitially, true, 'Timer should be scheduled after text');

    // Second: image message arrives -> must cancel timer immediately
    previewEl.textContent = 'Bạn: 3 hình ảnh';
    Listener.inspectConversationElement(convEl);

    const hasTimerAfterImage = Listener.hasPendingTimer('id_conv_cancel_test_1');
    assert.strictEqual(hasTimerAfterImage, false, 'Timer must be cancelled after image arrives');
  });

  it('Should cancel pending separator timer when STICKER arrives for conversation', () => {
    const convEl = createMockElement({ attributes: { 'data-id': 'conv_cancel_test_2' } });
    const previewEl = createMockElement({ classes: ['z-conv-message'], textContent: 'Bạn: Gửi thông tin nhé' });
    convEl.children.push(previewEl);

    // Text message arrives
    Listener.inspectConversationElement(convEl);
    assert.strictEqual(Listener.hasPendingTimer('id_conv_cancel_test_2'), true);

    // Sticker arrives -> cancel
    previewEl.textContent = 'Bạn: [Nhãn dán]';
    Listener.inspectConversationElement(convEl);

    assert.strictEqual(Listener.hasPendingTimer('id_conv_cancel_test_2'), false, 'Timer must be cancelled after sticker arrives');
  });

  it('Should NOT cancel timer when active chat contains outbound text with avatar img', () => {
    Listener._setBaselineReady(true);
    const convEl = createMockElement({ attributes: { 'data-id': 'conv_avatar_test' } });
    const previewEl = createMockElement({ classes: ['z-conv-message'], textContent: 'Bạn: Cần thuê gấp' });
    convEl.children.push(previewEl);

    Listener.inspectConversationElement(convEl);
    assert.strictEqual(Listener.hasPendingTimer('id_conv_avatar_test'), true);

    // Active chat view contains outbound message with avatar img
    const lastMsg = createMockElement({
      classes: ['msg-item', 'me'],
      textContent: 'Cần thuê gấp'
    });
    const avatar = createMockElement({ tagName: 'IMG', classes: ['avatar'] });
    lastMsg.children.push(avatar);

    sandbox.window.document.querySelectorAll = (sel) => {
      if (sel.includes('msg-item')) return [lastMsg];
      return [];
    };

    Listener.inspectActiveChatView();
    assert.strictEqual(Listener.hasPendingTimer('id_conv_avatar_test'), true, 'Timer must NOT be cancelled for text with avatar');
  });

  it('Should cancel timer when active chat view detects real photo attachment bubble', () => {
    Listener._setBaselineReady(true);
    const convEl = createMockElement({ attributes: { 'data-id': 'conv_active_photo_test' } });
    const previewEl = createMockElement({ classes: ['z-conv-message'], textContent: 'Bạn: Xem phòng này' });
    convEl.children.push(previewEl);

    Listener.inspectConversationElement(convEl);
    assert.strictEqual(Listener.hasPendingTimer('id_conv_active_photo_test'), true);

    // Active chat has empty text photo bubble
    const lastMsg = createMockElement({
      classes: ['msg-item', 'me'],
      textContent: ''
    });
    const photoBubble = createMockElement({ classes: ['photo-bubble'] });
    lastMsg.children.push(photoBubble);

    sandbox.window.document.querySelectorAll = (sel) => {
      if (sel.includes('msg-item')) return [lastMsg];
      return [];
    };

    Listener.inspectActiveChatView();
    assert.strictEqual(Listener.hasPendingTimer('id_conv_active_photo_test'), false, 'Timer must be cancelled when photo bubble arrives');
  });

  // Group 6: Mutex & Cooldown Guard
  console.log(`\n${colors.bright}6. Mutex & Cooldown Protection${colors.reset}`);
  await it('Should drop duplicate executeAutoSendSeparator when mutex or cooldown is active', async () => {
    let sendCount = 0;
    sandbox.window.ZaloQuickActionAdapter.sendChatMessage = async () => {
      sendCount++;
      return true;
    };

    // Reset mutex state
    Listener._resetMutex();

    // Call 1: Should succeed
    await Listener.executeAutoSendSeparator(null, '=================================');
    assert.strictEqual(sendCount, 1, 'First call should send');

    // Call 2: Immediately called -> mutex or cooldown should drop it
    await Listener.executeAutoSendSeparator(null, '=================================');
    assert.strictEqual(sendCount, 1, 'Second immediate call must be dropped by mutex/cooldown');
  });

  await it('Should re-acquire disconnected convEl by convKey in executeAutoSendSeparator', async () => {
    let clickedEl = null;
    sandbox.window.ZaloQuickActionDOM.simulateClick = (el) => {
      clickedEl = el;
    };
    sandbox.window.ZaloQuickActionAdapter.sendChatMessage = async () => true;

    // Reset mutex state
    Listener._resetMutex();

    const freshConvEl = createMockElement({
      attributes: { 'data-id': 'reacquire_conv_123' },
      isConnected: true
    });

    Listener.getConversationElements = () => [freshConvEl];

    const disconnectedEl = createMockElement({
      attributes: { 'data-id': 'reacquire_conv_123' },
      isConnected: false
    });

    await Listener.executeAutoSendSeparator(disconnectedEl, '=================================', 'id_reacquire_conv_123');
    assert.strictEqual(clickedEl, freshConvEl, 'Must re-acquire and click fresh connected element');
  });

  // Summary
  console.log(`\n${colors.cyan}------------------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bright}Test Summary:${colors.reset}`);
  console.log(`  Total Cases: ${passed + failed}`);
  console.log(`  ${colors.green}Passed:      ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed:      ${failed}${colors.reset}`);
  console.log(`${colors.cyan}------------------------------------------------------------------------${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.bright} 🎉 ALL ${passed} LISTENER TEST CASES PASSED 100%! 🎉 ${colors.reset}\n`);
  } else {
    process.exit(1);
  }
}

runListenerTests();
