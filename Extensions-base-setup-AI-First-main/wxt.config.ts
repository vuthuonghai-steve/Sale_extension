import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src', // D2 — skeleton nằm dưới src/
  entrypointsDir: resolve('src/1_engine'), // D9 — absolute path, né ambiguity relative-to-srcDir
  modules: ['@wxt-dev/module-react'], // D4/D5 stack
  webExt: {
    startUrls: ['https://chat.zalo.me'],
    chromiumProfile: resolve('.user-data'),
    keepProfileChanges: true,
    chromiumArgs: ['--remote-debugging-port=9222'],
  },
  alias: {
    '@contracts': resolve('src/0_contracts'),
    '@engine': resolve('src/1_engine'),
    '@platform': resolve('src/2_platform_adapters'),
    '@modules': resolve('src/3_modules'),
    '@presentation': resolve('src/4_presentation'),
  },
  imports: { eslintrc: { enabled: 9 } }, // fix defu-merge: true bị coi là <=8 → sinh JSON; 9 giữ nguyên → ESM
  manifest: () => {
    // D7 — function-form để đọc env sau khi .env load
    const env = import.meta.env as Record<string, string | undefined>;
    return {
      name: env.WXT_APP_NAME ?? '',
      description: env.WXT_APP_DESCRIPTION ?? '',
      version: '0.1.0',
      permissions: ['storage', 'tabs', 'scripting', 'alarms', 'sidePanel'],
      host_permissions: ['https://*.zalo.me/*', 'https://chat.zalo.me/*', 'http://127.0.0.1/*', 'http://localhost/*'],
      side_panel: {
        default_path: 'sidepanel/index.html',
      },
      options_ui: {
        page: 'options/index.html',
        open_in_tab: true,
      },
    };
  },
});
