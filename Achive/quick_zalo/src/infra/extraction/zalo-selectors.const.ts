export const SELECTOR_MESSAGE_NODES = [
  '[id^="message_frame_"]',
  '[id^="message-frame"]',
  '.message-frame',
  '[data-component="message-content-view"]',
  '.text-message__container',
  'div[data-id^="div_ReceivedMsg_"]',
  'div[data-id^="div_SentMsg_"]',
  '[id^="msg_"]',
  '[id^="msg-"]',
  '.grid-message-item',
].join(', ');

export const HEADER_TITLE_SELECTORS = [
  '.header-title .name',
  '.header-title',
  '#header-title',
  '.chat-header .name-title',
  '[data-id="header-title"]',
].join(', ');
