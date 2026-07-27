import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  runner: {
    chromiumProfile: resolve('.user-data'),
    keepProfileChanges: true,
    startUrls: ['https://chat.zalo.me'],
  },
  alias: {
    '@domain': resolve('src/domain'),
    '@app': resolve('src/app'),
    '@infra': resolve('src/infra'),
    '@shared': resolve('src/shared'),
    '@features': resolve('src/features'),
    '@composition': resolve('src/composition'),
  },
  manifest: {
    name: 'Quick Zalo Extension',
    version: '0.1.0',
    description: 'Chrome Extension for Quick Zalo Integration',
    permissions: ['storage', 'tabs', 'scripting', 'alarms', 'sidePanel'],
    host_permissions: ['https://*/*'],
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
    action: {
      default_title: 'Open Quick Zalo Sidepanel',
      default_icon: {
        16: '/icon/16.png',
        32: '/icon/32.png',
        48: '/icon/48.png',
        128: '/icon/128.png',
      },
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+Z',
          mac: 'Alt+Shift+Z',
        },
        description: 'Mở nhanh Quick Zalo Sidepanel',
      },
      'toggle-sidepanel': {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: 'Bật/Tắt Side Panel Quick Zalo',
      },
      'extract-chat-alt-a': {
        suggested_key: {
          default: 'Alt+A',
          mac: 'Alt+A',
        },
        description: 'Trích xuất tin nhắn tại giao diện chat hiện tại (Alt+A)',
      },
    },
  },
});
