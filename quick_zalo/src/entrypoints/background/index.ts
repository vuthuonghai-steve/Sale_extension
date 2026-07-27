import { createBackgroundContainer } from '@composition/background-container';

export default defineBackground(() => {
  const container = createBackgroundContainer();

  browser.runtime.onInstalled.addListener(() => {
    console.log('[bg] quick_zalo extension installed');
  });

  // Enable sidepanel to open when action icon is clicked
  if (typeof chrome !== 'undefined' && chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  void container;
});


