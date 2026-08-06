---
generated_at: "2026-08-01T12:50:00Z"
last_verified: "2026-08-01T12:50:00Z"
status: "verified"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "KHÔNG TÌM THẤY — chưa đăng ký src/features/registry.ts"
---

# config — Capability Summary

## 1. Overview

Module cấu hình ứng dụng xuyên suốt: định nghĩa AppConfig (environment, api, logger, features flags), validate + merge với defaults, lưu trữ qua browser.storage.local và expose qua IConfigService cho mọi runtime container.
- Loại module: functional (Module Chức năng) — domain + app + infra (config.entity/validator, 3 use cases, ConfigService adapter) chạy nền; không có React screen
- moduleMeta: KHÔNG TÌM THẤY — chưa đăng ký src/features/registry.ts (không tồn tại `src/features/config/`)
- Đăng ký tree_work.md: có — `Docs/tree_work.md` line 67 (config-container), line 76 (domain/config), line 82 (infra/config)

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | AppConfig | `src/domain/config/config.entity.ts` | Contract cấu hình: environment (development/staging/production), api (baseUrl, timeoutMs, maxRetries), logger (minLevel, maxCallsPerSec, bufferCapacity, storageKey, enableConsole, enableStorage), features (enableAutoSync, syncIntervalMinutes, enableNotifications, moduleStatuses) |
| service | validateConfig | `src/domain/config/config.validator.ts` | validateConfig(data) → Result<AppConfig, ConfigError> (reason: INVALID_ENVIRONMENT / INVALID_API_CONFIG / INVALID_LOGGER_CONFIG / INVALID_FEATURE_CONFIG); mergeWithDefaults; DEFAULT_APP_CONFIG |
| use case | GetConfigUseCase | `src/app/use-cases/config/get-config.use-case.ts` | execute() → AppConfig (delegate IConfigService.getConfig) |
| use case | UpdateConfigUseCase | `src/app/use-cases/config/update-config.use-case.ts` | execute(partialConfig) → Result<AppConfig, ConfigError> (merge nông theo nhóm + validate + persist) |
| use case | ResetConfigUseCase | `src/app/use-cases/config/reset-config.use-case.ts` | execute() → Result<AppConfig, ConfigError> (xóa storage, về defaults) |
| adapter | ConfigService | `src/infra/config/config-service.adapter.ts` | Implement IConfigService: getConfig (cache trong RAM + read storage), get, updateConfig, resetToDefaults, subscribe (listener Set + notify) |
| adapter | getStaticConfig | `src/infra/config/static-config.ts` | Config tĩnh từ import.meta.env (MODE, VITE_API_BASE_URL) với fallback DEFAULT_APP_CONFIG |

## 3. Boundaries

| Loại | Tên | Chi tiết |
|---|---|---|
| Storage đọc/ghi | browser.storage.local | IKeyValueStore (BrowserStorage 'local') — key CONFIG_CONSTANTS.STORAGE_KEYS.APP_CONFIG; get/set/remove; lỗi storage → ConfigError reason STORAGE_ERROR |
| Gate | storage injection | Storage không inject → chỉ trả static default, không persist (cachedConfig vẫn hoạt động) |
| Event | Không có | Module không publish/consume event bus — giao tiếp qua subscribe listener (IConfigService.subscribe) |

## 4. Cross-Module Links

- createConfigContainer (`src/composition/config-container.ts`) wiring ConfigService + GetConfigUseCase + UpdateConfigUseCase + ResetConfigUseCase — được tiêu thụ bởi background-container, sidepanel-container, ui-container
- BrowserStorage (`src/infra/browser/storage.ts`) implement IKeyValueStore — storage adapter dùng cho ConfigService

## 5. Infrastructure Mapping

| Adapter | Port | Table | Consumer đang dùng |
|---|---|---|---|
| ConfigService | IConfigService | browser.storage.local (IKeyValueStore) | createConfigContainer — inject qua `src/composition/config-container.ts` line 12; tiêu thụ bởi background-container line 12, sidepanel-container line 6, ui-container line 6 |

- Dual implementation: không có — 1 class ConfigService duy nhất implement IConfigService.

## 6. Docs References

- Không có spec (Docs/Specs/config/ không tồn tại — liên hệ feature-spec-designer nếu cần spec chi tiết)
- [tree_work.md](file://Docs/tree_work.md)
- [AGENTS.md](file://AGENTS.md)

## 7. Architecture Pattern Check

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | F1 — Single-Responsibility (đúng 1 chức năng: cấu hình app) | OK | `src/domain/config/` + `src/app/use-cases/config/` + `src/infra/config/` chỉ phục vụ cấu hình |
| 2 | F2 — Contract rõ INPUT/OUTPUT/HANDLE | OK | Input Partial<AppConfig>/key → Output AppConfig; error path Result + ConfigError (CONFIG_ERROR union với reason) |
| 3 | F3 — Có DEBUG + LOG phụ trợ | FAIL | KHÔNG có Evlog/logger trong module (grep config-service.adapter + 3 use cases = 0 kết quả); `getConfig` catch silent (`config-service.adapter.ts` line 43) — nuốt ngoại lệ không log |
| 4 | F4 — KHÔNG lẫn UI | OK | Không có React component/screen trong module |
| 5 | C1 — Không phụ thuộc chéo | OK | Chỉ expose qua IConfigService; không có phụ thuộc ngược |
| 6 | C2 — Độc lập qua contract | OK | Phụ thuộc qua IConfigService/IKeyValueStore port; domain thuần không chạm browser |

- Kết luận: ⚠️ LỆCH PATTERN KIẾN TRÚC — F3 FAIL (không Evlog + silent catch trong getConfig — thêm logger và trả lỗi/log khi storage fail thay vì nuốt).
