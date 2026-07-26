import { createBackgroundContainer } from '@composition/background-container';

export default defineBackground(() => {
  const container = createBackgroundContainer();

  browser.runtime.onInstalled.addListener(() => {
    console.log('[bg] quick_zalo extension installed');
  });

  void container;
});
