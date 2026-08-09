import { resolve } from 'node:path';
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: resolve('src/1_engine'),
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    startUrls: ['https://docs.google.com/forms', 'https://chrome.google.com'],
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
  imports: { eslintrc: { enabled: 9 } },
  manifest: () => {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    const env = meta.env ?? {};
    return {
      name: env.WXT_APP_NAME ?? 'Forms Extension MV3',
      description: env.WXT_APP_DESCRIPTION ?? 'Chrome Extension Manifest V3 for Forms automation & interaction',
      version: '0.1.0',
      permissions: ['storage', 'tabs', 'scripting', 'alarms', 'sidePanel', 'activeTab'],
      host_permissions: [
        'https://docs.google.com/forms/*',
        'https://forms.gle/*',
        'http://127.0.0.1/*',
        'http://localhost/*',
      ],
      side_panel: {
        default_path: 'sidepanel.html',
      },
      options_ui: {
        page: 'options.html',
        open_in_tab: true,
      },
      action: {
        default_title: 'Forms & Format Transformer',
      },
    };
  },
});

