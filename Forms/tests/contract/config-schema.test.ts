import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/0_contracts/config-schema.ts';


describe('ConfigSchema', () => {
  it('should validate valid environment configuration', () => {
    const raw = {
      WXT_APP_NAME: 'Forms Extension',
      WXT_APP_DESCRIPTION: 'MV3 Extension for Forms',
      WXT_LOG_LEVEL: 'debug',
    };

    const parsed = validateEnv(raw);
    expect(parsed.WXT_APP_NAME).toBe('Forms Extension');
    expect(parsed.WXT_LOG_LEVEL).toBe('debug');
  });

  it('should fail when required fields are missing', () => {
    const raw = {
      WXT_APP_NAME: '',
    };

    expect(() => validateEnv(raw)).toThrow();
  });
});
