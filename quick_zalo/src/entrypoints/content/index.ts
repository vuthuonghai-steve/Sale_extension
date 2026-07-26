import { createContentContainer } from '@composition/content-container';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_idle',
  main() {
    const { extractDom } = createContentContainer();

    browser.runtime.onMessage.addListener((raw, _s, sendResponse) => {
      const msg = raw as { name?: string };
      if (msg.name === 'dom.extract') {
        sendResponse(extractDom());
      }
      return true;
    });
  },
});
