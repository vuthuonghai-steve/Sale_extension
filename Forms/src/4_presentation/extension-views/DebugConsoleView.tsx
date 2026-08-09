import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header.tsx';
import { logger } from '@platform/telemetry/logger.ts';
import type { LogEntry } from '@contracts';
import '../styles/tokens.css';

export const DebugConsoleView: React.FC = () => {
  const [logs, setLogs] = useState<readonly LogEntry[]>(() => logger.getLogs());

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div style={{ maxWidth: '900px', margin: '1rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <Header title="Debug Console & Telemetry" statusText="Active Logs" statusType="warning" />

        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Tổng số log trong Ring Buffer: {logs.length}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => {
                logger.clearLogs();
                setLogs([]);
              }}
            >
              🧹 Xóa log
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#000',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              maxHeight: '450px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {logs.length === 0 ? (
              <span style={{ color: '#666' }}>Không có log nào.</span>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#888' }}>
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span
                    style={{
                      color:
                        log.level === 'error'
                          ? '#ef4444'
                          : log.level === 'warn'
                            ? '#f59e0b'
                            : log.level === 'debug'
                              ? '#94a3b8'
                              : '#10b981',
                      fontWeight: 'bold',
                    }}
                  >
                    [{log.level.toUpperCase()}]
                  </span>
                  <span style={{ color: '#60a5fa' }}>[{log.scope}]</span>
                  <span style={{ color: '#f8fafc' }}>{log.message}</span>
                  {log.traceId && <span style={{ color: '#a855f7' }}>({log.traceId})</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
