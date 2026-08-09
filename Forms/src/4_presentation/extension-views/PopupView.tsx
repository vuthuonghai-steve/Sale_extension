import React, { useState } from 'react';
import { Header } from '../components/Header.tsx';
import type { FormFieldDescriptor } from '@contracts';
import { FormValidator } from '@modules/sub-modules/form-validator/index.ts';
import { FormMatcher } from '@modules/sub-modules/form-matcher/index.ts';
import { logger } from '@platform/telemetry/logger.ts';
import { createTraceId } from '@platform/ipc/ipc-bus.ts';
import '../styles/tokens.css';

export const PopupView: React.FC = () => {
  const [fields, setFields] = useState<FormFieldDescriptor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fillStatus, setFillStatus] = useState<string | null>(null);

  const handleExtract = async () => {
    const traceId = createTraceId();
    logger.info('PopupView', 'Kích hoạt trích xuất Form từ tab hiện tại', {}, traceId);
    setLoading(true);
    setFillStatus(null);

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.tabs?.sendMessage) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const res: { data?: { fields?: FormFieldDescriptor[] } } | undefined =
            await chrome.tabs.sendMessage(tab.id, {
              action: 'forms:extract:request',
              traceId,
              timestamp: Date.now(),
              payload: {},
            });

          if (res?.data?.fields) {
            setFields(res.data.fields);
            logger.info(
              'PopupView',
              `Trích xuất thành công ${res.data.fields.length} trường`,
              {},
              traceId,
            );
          }
        }
      }
    } catch (err) {
      logger.error('PopupView', 'Lỗi khi trích xuất form', { error: String(err) }, traceId);
      setFillStatus('Không thể kết nối với trang (kiểm tra tab hiện tại).');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    const traceId = createTraceId();
    if (fields.length === 0) return;

    logger.info('PopupView', 'Bắt đầu quá trình tự động điền form', {}, traceId);
    setLoading(true);

    try {
      const sampleData: Record<string, string> = {
        'Họ và tên': 'Nguyễn Văn A',
        'Địa chỉ Email': 'nguyenvana@example.com',
        'Số điện thoại': '0912345678',
      };

      const instructions = FormMatcher.generateFillInstructions(fields, sampleData);
      const valueMap: Record<string, string | boolean | readonly string[]> = {};
      for (const item of instructions) {
        valueMap[item.fieldId] = item.value;
      }
      const validations = FormValidator.validateAll(fields, valueMap);

      const allValid = Object.values(validations).every((v) => v.isValid);
      if (!allValid) {
        setFillStatus('Dữ liệu không vượt qua validation!');
        return;
      }

      if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.tabs?.sendMessage) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'forms:fill:request',
            traceId,
            timestamp: Date.now(),
            payload: { instructions },
          });
        }
      }

      setFillStatus(`Đã điền thành công ${instructions.length} trường.`);
      logger.info('PopupView', `Hoàn thành tự động điền ${instructions.length} trường`, {}, traceId);
    } catch (err) {
      logger.error('PopupView', 'Lỗi khi điền form', { error: String(err) }, traceId);
      setFillStatus('Lỗi khi gửi lệnh điền form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '380px',
        minHeight: '440px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <Header title="Forms Automation" statusText="MV3 Active" statusType="success" />

      <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Tự động nhận diện và điền dữ liệu Form thông minh trên nền tảng Chromium V8.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                void handleExtract();
              }}
              disabled={loading}
            >
              {loading ? 'Đang đọc...' : '🔍 Quét Form'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                void handleAutoFill();
              }}
              disabled={loading || fields.length === 0}
            >
              ⚡ Tự động điền
            </button>
          </div>
        </div>


        {fillStatus && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {fillStatus}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              DANH SÁCH TRƯỜNG ({fields.length})
            </span>
          </div>

          {fields.length === 0 ? (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '1.5rem 0',
              }}
            >
              Chưa phát hiện form nào. Nhấn &quot;Quét Form&quot; để bắt đầu.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fields.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{f.label || f.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Type: {f.type}</div>
                  </div>
                  {f.required && <span className="badge badge-warning">Required</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
