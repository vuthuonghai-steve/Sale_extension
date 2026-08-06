import { describe, it, expect, beforeEach } from 'vitest';
import { EvlogLogger } from '@infra/logging/evlog-logger';
import { IndexedDBAdapter } from '@infra/logging/indexeddb-adapter';

describe('E2E Log Export & FIFO Ring Buffer Maintenance', () => {
  let logger: EvlogLogger;

  beforeEach(() => {
    logger = new EvlogLogger({
      minLevel: 'DEBUG',
      bufferCapacity: 20,
      enableConsole: false,
      enableStorage: true,
    });
  });

  it('Scenario: Should maintain FIFO Ring Buffer capacity when entries exceed limit', async () => {
    const adapter = new IndexedDBAdapter({ capacity: 10 });

    for (let i = 1; i <= 10; i++) {
      await adapter.push({
        trace_id: `trace-${i}`,
        scope: '@test/buffer',
        level: 'INFO',
        file_line: 'test.ts:10',
        decision_reason: `Event item ${i}`,
        payload: { id: i },
        timestamp: new Date().toISOString(),
      });
    }

    expect(adapter.getLength()).toBe(10);

    // Write 11th entry causing 10% (1 item) eviction
    await adapter.push({
      trace_id: 'trace-11',
      scope: '@test/buffer',
      level: 'INFO',
      file_line: 'test.ts:11',
      decision_reason: 'Event item 11',
      payload: { id: 11 },
      timestamp: new Date().toISOString(),
    });

    const entries = adapter.getInMemoryEntries();
    expect(entries.length).toBe(10);
    expect(entries[0].trace_id).toBe('trace-2'); // trace-1 evicted
    expect(entries[9].trace_id).toBe('trace-11');
  });

  it('Scenario: Should export valid JSON log buffer', async () => {
    logger.info('@domain/storage', 'Starting log export procedure', { format: 'JSON' });
    logger.warn('@domain/storage', 'High memory consumption detected', { usageMb: 4.2 });

    const exportedJson = logger.exportLogs();
    expect(typeof exportedJson).toBe('string');
    
    const parsed = JSON.parse(exportedJson);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty('trace_id');
    expect(parsed[0]).toHaveProperty('file_line');
    expect(parsed[0]).toHaveProperty('decision_reason');
  });

  it('Scenario: Should clear log entries on clearLogs invocation', async () => {
    logger.info('@domain/test', 'Temporary entry', {});
    await logger.clearLogs();
    const exportAfterClear = logger.exportLogs();
    expect(JSON.parse(exportAfterClear)).toEqual([]);
  });
});
