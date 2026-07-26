import { describe, it, expect, beforeEach } from 'vitest';
import { EvlogLogger } from './evlog-logger';
import { ChromeStorageAdapter } from './chrome-storage-adapter';

describe('EvlogLogger Engine & Dual Transport', () => {
  let logger: EvlogLogger;

  beforeEach(() => {
    logger = new EvlogLogger({
      minLevel: 'INFO',
      maxCallsPerSec: 30,
      bufferCapacity: 50,
      enableConsole: false,
      enableStorage: true,
    });
  });

  it('should emit a valid AgenticLogEntry matching spec schema', () => {
    const entry = logger.info('@domain/crm', 'Contact synchronized', {
      contactId: 'c123',
      name: 'John Doe',
    });

    expect(entry).not.toBeNull();
    if (entry) {
      expect(entry.trace_id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(entry.scope).toBe('@domain/crm');
      expect(entry.level).toBe('INFO');
      expect(entry.file_line).toBeDefined();
      expect(entry.decision_reason).toBe('Contact synchronized');
      expect(entry.payload).toEqual({ contactId: 'c123', name: 'John Doe' });
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    }
  });

  it('should sanitize PII fields in payload', () => {
    const entry = logger.info('@infra/auth', 'User login attempt', {
      user: 'alice',
      password: 'secretPassword123',
      token: 'bearer-xyz',
    });

    expect(entry).not.toBeNull();
    if (entry) {
      expect(entry.payload).toEqual({
        user: 'alice',
        password: '[REDACTED_PII]',
        token: '[REDACTED_PII]',
      });
    }
  });

  it('should filter out logs below configured LogLevel threshold', () => {
    logger.setLogLevel('WARN');

    const debugEntry = logger.debug('@domain/crm', 'Debug details', {});
    const infoEntry = logger.info('@domain/crm', 'Info notice', {});
    const warnEntry = logger.warn('@domain/crm', 'Warning raised', {});

    expect(debugEntry).toBeNull();
    expect(infoEntry).toBeNull();
    expect(warnEntry).not.toBeNull();
  });

  it('should perform FIFO Ring Buffer eviction when capacity is reached', () => {
    const storageAdapter = new ChromeStorageAdapter({ capacity: 10 });

    for (let i = 1; i <= 10; i++) {
      storageAdapter.push({
        trace_id: `id-${i}`,
        scope: '@test',
        level: 'INFO',
        file_line: 'test.ts:1',
        decision_reason: `Log entry ${i}`,
        payload: { index: i },
        timestamp: new Date().toISOString(),
      });
    }

    expect(storageAdapter.getLength()).toBe(10);

    // 11th log trigger eviction of oldest 10% (1 item)
    storageAdapter.push({
      trace_id: 'id-11',
      scope: '@test',
      level: 'INFO',
      file_line: 'test.ts:1',
      decision_reason: 'Log entry 11',
      payload: { index: 11 },
      timestamp: new Date().toISOString(),
    });

    const entries = storageAdapter.getEntries();
    expect(entries.length).toBe(10);
    expect(entries[0].trace_id).toBe('id-2'); // id-1 was evicted
    expect(entries[entries.length - 1].trace_id).toBe('id-11');
  });

  it('should export ring buffer logs to JSON string', () => {
    logger.info('@domain/test', 'Export test log', { key: 'val' });
    const jsonOutput = logger.exportLogs();
    expect(typeof jsonOutput).toBe('string');
    expect(jsonOutput).toContain('Export test log');
  });
});
