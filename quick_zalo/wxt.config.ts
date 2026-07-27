import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
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
    action: {
      default_title: 'Open Quick Zalo Sidepanel',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
  },
});

