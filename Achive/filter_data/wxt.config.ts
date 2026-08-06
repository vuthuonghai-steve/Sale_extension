import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Automation & Data Scraper',
    description: 'Lightweight automation tool for form filling, data scraping, auto-clicking, and hotkeys.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'sidePanel'],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    web_accessible_resources: [
      {
        resources: ['dashboard.html', 'sidepanel.html'],
        matches: ['<all_urls>'],
      },
    ],
    commands: {
      'trigger-fill': {
        suggested_key: {
          default: 'Alt+Shift+F',
          mac: 'Alt+Shift+F',
        },
        description: 'Tự động điền dữ liệu (Auto Fill Form)',
      },
      'trigger-scrape': {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: 'Trích xuất dữ liệu nhanh (Quick Data Scrape)',
      },
    },
  },
});
