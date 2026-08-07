import { describe, expect, it } from 'vitest';
import { parsePageMetadata } from '../../../../src/3_modules/sub-modules/dom-parser/index';
import domFixtures from './fixtures.json';

describe('dom-parser', () => {
  it('parsePageMetadata: HTML hợp lệ → title/url/textLength', () => {
    const result = parsePageMetadata(domFixtures.sampleHtml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe('My & Page');
      expect(result.data.url).toBe('https://example.com/post');
      expect(result.data.textLength).toBeGreaterThan(0);
    }
  });

  it('parsePageMetadata: fallbackUrl dùng khi thiếu canonical', () => {
    const result = parsePageMetadata(domFixtures.noCanonicalHtml, 'https://fallback.example');
    expect(result).toEqual({
      ok: true,
      data: { title: 'No Canonical', url: 'https://fallback.example', textLength: 18 },
    });
  });

  it('parsePageMetadata: HTML rỗng → err, không throw', () => {
    const result = parsePageMetadata('');
    expect(result).toEqual({ ok: false, error: 'empty html input' });
  });

  it('parsePageMetadata: thiếu title và fallbackUrl rỗng → err', () => {
    const result = parsePageMetadata('<html><body>nothing</body></html>');
    expect(result.ok).toBe(false);
  });
});
