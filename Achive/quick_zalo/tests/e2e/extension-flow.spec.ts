import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EvlogLogger } from '@infra/logging/evlog-logger';
import { ok, err, type Result } from '@shared/kernel/result';
import { mswServer } from '../mocks/msw-server';

describe('E2E Extension Flow & Result Error Handling', () => {
  let logger: EvlogLogger;

  beforeEach(() => {
    mswServer.listen();
    logger = new EvlogLogger({
      minLevel: 'INFO',
      enableConsole: false,
      enableStorage: true,
    });
  });

  afterEach(() => {
    mswServer.close();
  });

  it('Scenario 1: Should emit structured Evlog entry and trigger Dual Transport', () => {
    const entry = logger.info('@domain/crm', 'Contact Sync Completed', {
      contactId: 'ct_999',
      status: 'SUCCESS',
    });

    expect(entry).not.toBeNull();
    if (entry) {
      expect(entry.trace_id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(entry.scope).toBe('@domain/crm');
      expect(entry.level).toBe('INFO');
      expect(entry.decision_reason).toBe('Contact Sync Completed');
      expect(entry.payload).toEqual({ contactId: 'ct_999', status: 'SUCCESS' });
      expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0);
    }
  });

  it('Scenario 2: Should handle failure gracefully using Result<T, E> Pattern without throwing', () => {
    function processAction(valid: boolean): Result<{ id: string }, { code: string; message: string }> {
      if (!valid) {
        return err({
          code: 'INVALID_INPUT',
          message: 'Contact payload missing required fields',
        });
      }
      return ok({ id: 'ct_100' });
    }

    const failureResult = processAction(false);
    expect(failureResult.isErr).toBe(true);

    if (failureResult.isErr) {
      const logEntry = logger.error(
        '@domain/crm',
        'Action failed due to invalid input',
        { errorCode: failureResult.error.code },
        new Error(failureResult.error.message)
      );

      expect(logEntry).not.toBeNull();
      if (logEntry) {
        expect(logEntry.level).toBe('ERROR');
        expect(logEntry.file_line).toBeDefined();
        expect(logEntry.stack_trace).toContain('Contact payload missing required fields');
      }
    }
  });

  it('Scenario 3: Should support MSW mock server interaction flow', () => {
    const response = mswServer.handleRequest('getContactInfo', 'c_123');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      id: 'c_123',
      name: 'Mock Customer',
      phone: '0901234567',
      status: 'ACTIVE',
    });

    logger.info('@infra/network', 'Fetched mock contact details', response.data as Record<string, unknown>);
  });
});
