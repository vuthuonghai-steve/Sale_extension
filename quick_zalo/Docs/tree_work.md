Blueprint dưới đây giữ **WXT chỉ là shell** (entrypoints + build), còn business nằm ở core layers độc lập TypeScript. Cấu trúc bám `srcDir` và entrypoints của WXT, nhưng không để framework “nuốt” domain. [wxt](https://wxt.dev/guide/essentials/project-structure)

## Nguyên tắc cốt lõi

- WXT lo: entrypoints, manifest generation, HMR, build/publish. [github](https://github.com/gakeez/agents_md_collection/blob/main/examples/chrome-extension-development.md)
- Core lo: domain, use cases, ports, typed contracts, DI.
- `browser.*` / `chrome.*` chỉ xuất hiện trong `infra/browser`.
- Content script mỏng; background là orchestration hub. [dev](https://dev.to/hewitt/how-to-structure-a-production-ready-chrome-extension-manifest-v3-2hlf)
- Feature-first + layer-second: mỗi feature có application/domain/infra/ui riêng.

***

## Sơ đồ kiến trúc

```txt
┌─────────────────────────────────────────────────────────────┐
│  ENTRYPOINTS (WXT shell)                                    │
│  background | content | popup | options | sidepanel         │
└───────────────┬─────────────────────────────────────────────┘
                │ thin adapters only
┌───────────────▼─────────────────────────────────────────────┐
│  COMPOSITION ROOT                                           │
│  background-container | content-container | ui-container    │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  APPLICATION                                                │
│  use-cases | handlers | dto | ports (interfaces)            │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  DOMAIN                                                     │
│  entities | value-objects | policies | domain-events        │
└─────────────────────────────────────────────────────────────┘
                ▲
┌───────────────┴─────────────────────────────────────────────┐
│  INFRASTRUCTURE                                             │
│  browser adapters | storage | http | auth | logging         │
└─────────────────────────────────────────────────────────────┘

SHARED CONTRACTS: messages | commands | queries | events | errors
```

***

## Folder structure production

Bật `srcDir: 'src'` trong `wxt.config.ts` để tách source khỏi config. [wxt](https://wxt.dev/guide/essentials/project-structure)

```txt
extension-advanced/
├── wxt.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── icon-*.png
├── modules/                         # WXT modules (tooling only)
└── src/
    ├── entrypoints/                 # WXT shell — KHÔNG chứa business
    │   ├── background/
    │   │   └── index.ts
    │   ├── content/
    │   │   └── index.ts
    │   ├── popup/
    │   │   ├── index.html
    │   │   └── main.tsx
    │   ├── options/
    │   │   ├── index.html
    │   │   └── main.tsx
    │   ├── sidepanel/
    │   │   ├── index.html
    │   │   └── main.tsx
    │   └── page-bridge.unlisted.ts  # MAIN world bridge nếu cần
    │
    ├── composition/                 # DI / wiring theo runtime
    │   ├── background-container.ts
    │   ├── content-container.ts
    │   └── ui-container.ts
    │
    ├── shared/
    │   ├── contracts/
    │   │   ├── messages.ts          # discriminated unions
    │   │   ├── commands.ts
    │   │   ├── queries.ts
    │   │   ├── events.ts
    │   │   └── errors.ts
    │   ├── kernel/
    │   │   ├── result.ts            # Result/Either
    │   │   ├── brand.ts
    │   │   └── clock.ts
    │   └── types/
    │
    ├── domain/                      # pure TS, zero browser deps
    │   ├── entities/
    │   ├── value-objects/
    │   ├── policies/
    │   └── events/
    │
    ├── app/                         # application layer
    │   ├── ports/                   # interfaces (IStorage, ITabs, IBus)
    │   ├── use-cases/
    │   ├── handlers/                # message → use-case mapping
    │   └── dto/
    │
    ├── infra/
    │   ├── browser/
    │   │   ├── runtime-bus.ts
    │   │   ├── tabs.ts
    │   │   ├── scripting.ts
    │   │   └── storage.ts
    │   ├── http/
    │   ├── auth/
    │   └── logging/
    │
    ├── features/                    # bounded contexts
    │   ├── page-capture/
    │   │   ├── domain/
    │   │   ├── application/
    │   │   ├── infra/
    │   │   └── ui/
    │   ├── automation/
    │   ├── settings/
    │   └── sync/
    │
    ├── ui/                          # shared presentation
    │   ├── components/
    │   ├── hooks/
    │   └── styles/
    │
    └── assets/
```

***

## Config WXT tối thiểu

```ts
// wxt.config.ts
import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'], // hoặc vue
  alias: {
    '@domain': resolve('src/domain'),
    '@app': resolve('src/app'),
    '@infra': resolve('src/infra'),
    '@shared': resolve('src/shared'),
    '@features': resolve('src/features'),
    '@composition': resolve('src/composition'),
  },
  manifest: {
    name: 'Advanced Extension',
    permissions: ['storage', 'tabs', 'scripting', 'alarms', 'sidePanel'],
    host_permissions: ['https://*/*'],
  },
});
```

Alias nên khai báo trong `wxt.config.ts` (không nhét tay vào `tsconfig`) để bundler + TS cùng resolve. [wxt](https://wxt.dev/guide/essentials/config/typescript)

***

## Shared contracts (trái tim hệ thống)

```ts
// src/shared/contracts/messages.ts
import type { CapturePageCommand } from './commands';
import type { GetSettingsQuery } from './queries';
import type { AppError } from './errors';

export type Message =
  | { type: 'command'; name: 'page.capture'; payload: CapturePageCommand }
  | { type: 'query'; name: 'settings.get'; payload: GetSettingsQuery }
  | { type: 'event'; name: 'page.captured'; payload: { tabId: number; url: string } };

export type MessageResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export type MessageName = Message['name'];
```

```ts
// src/shared/contracts/errors.ts
export type AppError =
  | { code: 'VALIDATION'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'PERMISSION'; message: string }
  | { code: 'INFRA'; message: string; cause?: unknown };
```

```ts
// src/shared/kernel/result.ts
export type Result<T, E = { code: string; message: string }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

***

## Ports (application không biết Chrome)

```ts
// src/app/ports/storage.port.ts
export interface IKeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// src/app/ports/tabs.port.ts
export interface ITabs {
  getActive(): Promise<{ id: number; url?: string } | null>;
  sendToTab<T>(tabId: number, message: unknown): Promise<T>;
}

// src/app/ports/message-bus.port.ts
import type { Message, MessageResponse } from '@shared/contracts/messages';

export interface IMessageBus {
  request<T>(message: Message): Promise<MessageResponse<T>>;
  publish(message: Message): Promise<void>;
  on(
    name: Message['name'],
    handler: (msg: Message) => Promise<MessageResponse> | MessageResponse,
  ): () => void;
}
```

***

## Infrastructure adapters

```ts
// src/infra/browser/storage.ts
import type { IKeyValueStore } from '@app/ports/storage.port';

export class BrowserStorage implements IKeyValueStore {
  constructor(private area: 'local' | 'sync' = 'local') {}

  async get<T>(key: string): Promise<T | undefined> {
    const bag = await browser.storage[this.area].get(key);
    return bag[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage[this.area].set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await browser.storage[this.area].remove(key);
  }
}
```

```ts
// src/infra/browser/runtime-bus.ts
import type { IMessageBus } from '@app/ports/message-bus.port';
import type { Message, MessageResponse } from '@shared/contracts/messages';

type Handler = (msg: Message) => Promise<MessageResponse> | MessageResponse;

export class RuntimeMessageBus implements IMessageBus {
  private handlers = new Map<Message['name'], Handler>();

  constructor() {
    browser.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
      const msg = raw as Message;
      const handler = this.handlers.get(msg.name);
      if (!handler) {
        sendResponse({
          ok: false,
          error: { code: 'NOT_FOUND', message: `No handler: ${msg.name}` },
        } satisfies MessageResponse);
        return false;
      }
      Promise.resolve(handler(msg)).then(sendResponse);
      return true; // async response
    });
  }

  on(name: Message['name'], handler: Handler) {
    this.handlers.set(name, handler);
    return () => this.handlers.delete(name);
  }

  async request<T>(message: Message): Promise<MessageResponse<T>> {
    return browser.runtime.sendMessage(message) as Promise<MessageResponse<T>>;
  }

  async publish(message: Message): Promise<void> {
    await browser.runtime.sendMessage(message);
  }
}
```

***

## Domain + Use case mẫu

```ts
// src/features/page-capture/domain/page-snapshot.ts
export type PageSnapshot = {
  readonly url: string;
  readonly title: string;
  readonly capturedAt: number;
  readonly textSample: string;
};

export function createPageSnapshot(input: {
  url: string;
  title: string;
  textSample: string;
  now: number;
}): PageSnapshot {
  if (!input.url.startsWith('http')) {
    throw new Error('Invalid url');
  }
  return {
    url: input.url,
    title: input.title.trim() || 'Untitled',
    textSample: input.textSample.slice(0, 2000),
    capturedAt: input.now,
  };
}
```

```ts
// src/features/page-capture/application/capture-page.use-case.ts
import type { IKeyValueStore } from '@app/ports/storage.port';
import type { ITabs } from '@app/ports/tabs.port';
import { createPageSnapshot } from '../domain/page-snapshot';
import { err, ok, type Result } from '@shared/kernel/result';
import type { AppError } from '@shared/contracts/errors';

export class CapturePageUseCase {
  constructor(
    private readonly tabs: ITabs,
    private readonly store: IKeyValueStore,
    private readonly clock: () => number = () => Date.now(),
  ) {}

  async execute(): Promise<Result<{ id: string }, AppError>> {
    const tab = await this.tabs.getActive();
    if (!tab?.id || !tab.url) {
      return err({ code: 'NOT_FOUND', message: 'No active tab' });
    }

    // content script trả raw DOM data — không chứa business rules
    const raw = await this.tabs.sendToTab<{ title: string; text: string }>(
      tab.id,
      { type: 'query', name: 'dom.extract', payload: {} },
    );

    try {
      const snapshot = createPageSnapshot({
        url: tab.url,
        title: raw.title,
        textSample: raw.text,
        now: this.clock(),
      });
      const id = `snap_${snapshot.capturedAt}`;
      await this.store.set(`snapshot:${id}`, snapshot);
      return ok({ id });
    } catch (e) {
      return err({
        code: 'VALIDATION',
        message: e instanceof Error ? e.message : 'Invalid snapshot',
      });
    }
  }
}
```

***

## Composition roots (DI theo runtime)

```ts
// src/composition/background-container.ts
import { BrowserStorage } from '@infra/browser/storage';
import { RuntimeMessageBus } from '@infra/browser/runtime-bus';
import { BrowserTabs } from '@infra/browser/tabs';
import { CapturePageUseCase } from '@features/page-capture/application/capture-page.use-case';
import type { Message, MessageResponse } from '@shared/contracts/messages';

export function createBackgroundContainer() {
  const store = new BrowserStorage('local');
  const bus = new RuntimeMessageBus();
  const tabs = new BrowserTabs();

  const capturePage = new CapturePageUseCase(tabs, store);

  bus.on('page.capture', async (_msg: Message): Promise<MessageResponse> => {
    const result = await capturePage.execute();
    return result.ok
      ? { ok: true, data: result.value }
      : { ok: false, error: result.error };
  });

  return { bus, store, tabs, capturePage };
}
```

```ts
// src/composition/content-container.ts
export function createContentContainer() {
  return {
    extractDom() {
      return {
        title: document.title,
        text: document.body?.innerText ?? '',
      };
    },
  };
}
```

```ts
// src/composition/ui-container.ts
import { RuntimeMessageBus } from '@infra/browser/runtime-bus';

export function createUiContainer() {
  const bus = new RuntimeMessageBus(); // client side: request/publish only
  return {
    bus,
    capturePage: () =>
      bus.request<{ id: string }>({
        type: 'command',
        name: 'page.capture',
        payload: {},
      }),
  };
}
```

***

## Entrypoints — chỉ bootstrap

Runtime code **phải nằm trong `main`**, không để top-level side effects (WXT import entrypoint lúc build trên Node). [github](https://github.com/gakeez/agents_md_collection/blob/main/examples/chrome-extension-development.md)

```ts
// src/entrypoints/background/index.ts
import { createBackgroundContainer } from '@composition/background-container';

export default defineBackground(() => {
  const container = createBackgroundContainer();

  browser.runtime.onInstalled.addListener(() => {
    console.log('[bg] installed');
  });

  // alarms, contextMenus, sidePanel wiring...
  void container;
});
```

```ts
// src/entrypoints/content/index.ts
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
        return true;
      }
      return false;
    });
  },
});
```

```tsx
// src/entrypoints/popup/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createUiContainer } from '@composition/ui-container';
import { PopupApp } from '@features/page-capture/ui/PopupApp';

const container = createUiContainer();

createRoot(document.getElementById('root')!).render(
  <PopupApp onCapture={() => container.capturePage()} />,
);
```

***

## Luồng runtime chuẩn

```txt
Popup / Sidepanel
    │  command: page.capture
    ▼
Background (composition + use-case)
    │  query: dom.extract
    ▼
Content script (DOM bridge only)
    │  raw { title, text }
    ▼
Domain createPageSnapshot
    │
    ▼
Infra storage / http / telemetry
    │
    ▼
MessageResponse { ok, data | error }
```

***

## Quy tắc dependency (enforce bằng ESLint)

| Layer | Được import | Cấm import |
|---|---|---|
| `domain/` | pure TS only | `browser`, WXT, React, infra |
| `app/` | domain, shared, ports | `browser`, entrypoints, UI |
| `infra/` | app ports, shared | domain internals (nên qua ports) |
| `features/*/ui` | app dto, shared contracts | infra browser trực tiếp |
| `entrypoints/` | composition only | use-case / domain trực tiếp |
| `composition/` | mọi layer (wiring) | — |

Gợi ý ESLint boundaries:

```js
// eslint.config — ý tưởng
// domain: no-restricted-imports browser, wxt, react
// app: no-restricted-imports browser, wxt
// entrypoints: only allow @composition/*
```

***

## Checklist advanced

- Typed message bus + `Result`/`MessageResponse` thống nhất
- Background là single orchestration hub
- Content script / MAIN-world unlisted script tách rõ ISOLATED vs MAIN [github](https://github.com/gakeez/agents_md_collection/blob/main/examples/chrome-extension-development.md)
- Storage schema versioning (`settings:v2`, migration on install)
- Feature flags trong `app.config.ts` / remote config adapter
- Logging structured (`infra/logging`) với correlation id theo message
- Test: domain unit (pure), use-case với fake ports, e2e Playwright + load extension
- Không auto-import lung tung `utils/` cho business — tránh magic coupling với convention WXT [wxt](https://wxt.dev/guide/essentials/project-structure)

***

## Thứ tự triển khai đề xuất

1. Scaffold WXT + `srcDir` + alias  
2. `shared/contracts` + `kernel/result`  
3. ports + `RuntimeMessageBus` + `BrowserStorage`  
4. 1 feature end-to-end (`page-capture`)  
5. composition roots cho bg/content/ui  
6. ESLint boundary + unit tests domain/use-case  
7. Thêm sidepanel/options/alarms theo cùng pattern  

***

## Nguồn tham chiếu

- [WXT Project Structure](https://wxt.dev/guide/essentials/project-structure) — `srcDir`, entrypoints, modules. [wxt](https://wxt.dev/guide/essentials/project-structure)
- [WXT Entrypoints](https://wxt.dev/guide/essentials/entrypoints) — background/content/popup/sidepanel, unlisted scripts, rule “no runtime outside main”. [github](https://github.com/gakeez/agents_md_collection/blob/main/examples/chrome-extension-development.md)
- [WXT TypeScript config & alias](https://wxt.dev/guide/essentials/config/typescript) — path alias qua `wxt.config.ts`. [wxt](https://wxt.dev/guide/essentials/config/typescript)
- Production MV3 structure patterns — tách UI / worker / core modules. [dev](https://dev.to/hewitt/how-to-structure-a-production-ready-chrome-extension-manifest-v3-2hlf)