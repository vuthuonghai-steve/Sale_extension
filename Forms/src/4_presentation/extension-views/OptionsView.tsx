import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header.tsx';
import { storageAdapter } from '@platform/storage/chrome-storage-adapter.ts';
import { logger } from '@platform/telemetry/logger.ts';
import { createTraceId } from '@platform/ipc/ipc-bus.ts';
import type { AppSettings } from '@contracts';
import '../styles/tokens.css';

export const OptionsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    autoFillEnabled: true,
    theme: 'dark',
    logLevel: 'info',
    enableSoundNotification: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void storageAdapter.get('settings').then((data) => {
      if (data) setSettings(data);
    });
  }, []);

  const handleSave = async () => {
    const traceId = createTraceId();
    logger.info('OptionsView', 'Lưu cấu hình người dùng', { settings }, traceId);
    await storageAdapter.set('settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <Header title="Cài Đặt Extension" statusText="Options" statusType="info" />

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoFillEnabled}
                onChange={(e) => setSettings({ ...settings, autoFillEnabled: e.target.checked })}
              />
              <span style={{ fontWeight: 600 }}>Tự động kích hoạt khi phát hiện Form</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Giao diện (Theme)
            </label>
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings({ ...settings, theme: e.target.value as AppSettings['theme'] })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <option value="dark">Tối (Dark)</option>
              <option value="light">Sáng (Light)</option>
              <option value="system">Theo hệ thống (System)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Log Level
            </label>
            <select
              value={settings.logLevel}
              onChange={(e) =>
                setSettings({ ...settings, logLevel: e.target.value as AppSettings['logLevel'] })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <option value="debug">Debug (Chi tiết nhất)</option>
              <option value="info">Info (Thông tin chuẩn)</option>
              <option value="warn">Warn (Cảnh báo)</option>
              <option value="error">Error (Chỉ lỗi)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                void handleSave();
              }}
            >
              💾 Lưu cài đặt
            </button>
            {saved && <span className="badge badge-success">Đã lưu thành công!</span>}
          </div>

        </div>
      </div>
    </div>
  );
};
