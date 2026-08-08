import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { IpcAction } from '@contracts/ipc-actions';
import type { StorageKey } from '@contracts/storage-schema';
import { localDriver } from '@platform/storage/local-driver';
import { sendMessage } from '@platform/ipc/sender';

/**
 * Menu Home Popup App — Giao diện quản lý Modul chính & Cài đặt hệ thống (ADR-007).
 * Hiển thị danh sách các Modul chính và công tắc Bật/Tắt tính năng.
 */

interface SettingsState {
  theme: string;
  telemetry_enabled: boolean;
  log_level: string;
  feature_zalo_quick_action_enabled: boolean;
}

const INITIAL: SettingsState = {
  theme: 'system',
  telemetry_enabled: true,
  log_level: 'INFO',
  feature_zalo_quick_action_enabled: true,
};

const KEYS: { key: StorageKey; field: keyof SettingsState }[] = [
  { key: 'settings.theme', field: 'theme' },
  { key: 'settings.telemetry_enabled', field: 'telemetry_enabled' },
  { key: 'settings.log_level', field: 'log_level' },
  { key: 'settings.feature_zalo_quick_action_enabled', field: 'feature_zalo_quick_action_enabled' },
];

export function PopupApp(): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsState>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): void => {
    const load = async (): Promise<void> => {
      const next = { ...INITIAL };
      let failed = false;
      for (const { key, field } of KEYS) {
        let value: unknown;
        const response = await sendMessage(IpcAction.SettingsGet, { key });
        if (response?.ok === true) {
          value = response.data.value;
        } else {
          // Direct storage fallback if SW IPC is sleeping
          const localRes = await localDriver.get(key);
          if (localRes.ok) {
            value = localRes.data;
          } else {
            failed = true;
          }
        }

        switch (field) {
          case 'theme':
            next.theme = typeof value === 'string' ? value : next.theme;
            break;
          case 'telemetry_enabled':
            next.telemetry_enabled = typeof value === 'boolean' ? value : next.telemetry_enabled;
            break;
          case 'log_level':
            next.log_level = typeof value === 'string' ? value : next.log_level;
            break;
          case 'feature_zalo_quick_action_enabled':
            next.feature_zalo_quick_action_enabled =
              typeof value === 'boolean' ? value : next.feature_zalo_quick_action_enabled;
            break;
        }
      }
      setSettings(next);
      setError(failed ? 'Một số settings chưa phản hồi (SW chưa sẵn sàng).' : null);
    };
    void load();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSetting = (key: StorageKey, value: unknown): void => {
    void localDriver.set({ [key]: value });

    void sendMessage(IpcAction.SettingsSet, { key, value }).then((response) => {
      if (response.ok === true) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setError(null);
      } else {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    });
  };

  const openDebugConsole = (): void => {
    void browser.tabs.create({ url: browser.runtime.getURL('/debug-console.html') });
  };

  return (
    <div
      style={{
        width: 320,
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: '#f8fafc',
        color: '#0f172a',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Z
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Zalo Quick Assistant</h1>
            <span style={{ fontSize: 11, color: '#64748b' }}>Menu Home & Quản Lý Tính Năng</span>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            background: '#dcfce7',
            color: '#15803d',
            fontWeight: 600,
          }}
        >
          v1.0.0
        </span>
      </div>

      {/* Section: Modul Chính */}
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px',
          }}
        >
          Danh Sách Modul Chính
        </h2>

        {/* Card Modul 1: zalo-quick-action-extractor */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 10,
            padding: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                Trích Xuất Tin Nhắn Zalo & Quick Copy
              </span>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                <code>zalo-quick-action-extractor</code>
              </div>
            </div>
            {/* Toggle Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20, flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.feature_zalo_quick_action_enabled}
                onChange={(e) => updateSetting('settings.feature_zalo_quick_action_enabled', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.feature_zalo_quick_action_enabled ? '#2563eb' : '#cbd5e1',
                  borderRadius: 20,
                  transition: '0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    height: 14,
                    width: 14,
                    left: settings.feature_zalo_quick_action_enabled ? 19 : 3,
                    bottom: 3,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s',
                  }}
                />
              </span>
            </label>
          </div>

          <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 8px', lineHeight: 1.4 }}>
            Bóc tách văn bản, bảo tồn Emoji, lọc 7 bước làm sạch tin nhắn BĐS & sao chép qua phím <strong>Alt + Q</strong> hoặc Mini Floating Bar.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #f1f5f9' }}>
            <span style={{ fontSize: 11, color: settings.feature_zalo_quick_action_enabled ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>
              {settings.feature_zalo_quick_action_enabled ? '● Đang kích hoạt (Alt + Q)' : '○ Đã tắt'}
            </span>
            <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
              chat.zalo.me
            </span>
          </div>
        </div>
      </div>

      {/* Section: Cài Đặt Hệ Thống */}
      <div style={{ marginBottom: 12 }}>
        <h2
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px',
          }}
        >
          Cài Đặt Hệ Thống
        </h2>

        <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#334155' }}>Giao diện (Theme)</span>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('settings.theme', e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#334155' }}>Log Level</span>
            <select
              value={settings.log_level}
              onChange={(e) => updateSetting('settings.log_level', e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#334155' }}>Ghi Telemetry Logs</span>
            <input
              type="checkbox"
              checked={settings.telemetry_enabled}
              onChange={(e) => updateSetting('settings.telemetry_enabled', e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <button
        type="button"
        onClick={openDebugConsole}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <span>🛠️ Mở Debug Console</span>
      </button>

      {error !== null && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 8, textAlign: 'center' }}>{error}</p>}
    </div>
  );
}
