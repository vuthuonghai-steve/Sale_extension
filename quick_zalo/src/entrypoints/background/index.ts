import { createBackgroundContainer } from '@composition/background-container';
import { EXTENSION_SHORTCUTS } from '@shared/constants/shortcuts.constants';

export default defineBackground(() => {
  const container = createBackgroundContainer();

  browser.runtime.onInstalled.addListener(() => {
    console.log('[bg] quick_zalo extension installed');
  });

  // Enable sidepanel to open when action icon is clicked
  if (typeof chrome !== 'undefined' && chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  // Listen for registered extension keyboard shortcuts
  container.shortcuts.onCommand(async (command) => {
    console.log('[bg] Keyboard shortcut triggered:', command);

    switch (command) {
      case EXTENSION_SHORTCUTS.TOGGLE_SIDEPANEL: {
        const activeTab = await container.tabs.getActive();
        if (activeTab?.id && typeof chrome !== 'undefined' && chrome.sidePanel?.open) {
          void chrome.sidePanel.open({ tabId: activeTab.id });
        }
        break;
      }
      case EXTENSION_SHORTCUTS.EXTRACT_CURRENT_MESSAGE:
      case EXTENSION_SHORTCUTS.EXTRACT_CHAT_ALT_A: {
        const activeTab = await container.tabs.getActive();
        if (activeTab?.id) {
          void container.tabs.sendToTab(activeTab.id, {
            type: 'SHORTCUT_EXTRACT_CHAT',
            payload: { timestamp: new Date().toISOString() },
          });
        }
        break;
      }
      case EXTENSION_SHORTCUTS.QUICK_SEARCH_CONTACT: {
        const activeTab = await container.tabs.getActive();
        if (activeTab?.id) {
          void container.tabs.sendToTab(activeTab.id, {
            type: 'SHORTCUT_FOCUS_SEARCH',
            payload: { timestamp: new Date().toISOString() },
          });
        }
        break;
      }
      default:
        break;
    }
  });
});
