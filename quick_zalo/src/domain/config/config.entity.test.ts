import { describe, it, expect } from 'vitest';
import { validateConfig, mergeWithDefaults, DEFAULT_APP_CONFIG } from './config.validator';

describe('Config Domain Validation', () => {
  it('should return default config when validating empty object', () => {
    const res = validateConfig({});
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual(DEFAULT_APP_CONFIG);
    }
  });

  it('should validate and merge valid partial config', () => {
    const res = validateConfig({
      environment: 'production',
      api: { baseUrl: 'https://api.prod.zalo.vn', timeoutMs: 5000, maxRetries: 5 },
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.environment).toBe('production');
      expect(res.value.api.baseUrl).toBe('https://api.prod.zalo.vn');
      expect(res.value.features.enableAutoSync).toBe(true); // preserved default
    }
  });

  it('should return error for invalid environment', () => {
    const res = validateConfig({ environment: 'invalid_env' as any });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('INVALID_ENVIRONMENT');
    }
  });

  it('should return error for negative api timeout', () => {
    const res = validateConfig({ api: { baseUrl: 'http://test', timeoutMs: -100, maxRetries: 1 } });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('INVALID_API_CONFIG');
    }
  });

  it('should fallback to defaults when using mergeWithDefaults on invalid input', () => {
    const merged = mergeWithDefaults({ environment: 'bad_env' as any });
    expect(merged).toEqual(DEFAULT_APP_CONFIG);
  });
});
