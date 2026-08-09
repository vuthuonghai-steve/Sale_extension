import { describe, it, expect } from 'vitest';
import { TextSanitizer } from '../../src/3_modules/sub-modules/text-sanitizer/index.ts';

describe('TextSanitizer', () => {
  it('should remove hidden characters and zero-width spaces', () => {
    const raw = 'Hello\u200B\uFEFFWorld\u00A0Test';
    const clean = TextSanitizer.removeHiddenChars(raw);
    expect(clean).toBe('HelloWorld Test');
  });

  it('should handle empty or null string', () => {
    expect(TextSanitizer.removeHiddenChars('')).toBe('');
    expect(TextSanitizer.cleanWhitespace('')).toBe('');
    expect(TextSanitizer.stripUrlTracking('')).toBe('');
  });

  it('should clean multiple redundant line breaks and extra whitespace', () => {
    const raw = '  Line 1  \n\n\n\n   Line 2   \n\n   Line 3   ';
    const clean = TextSanitizer.cleanWhitespace(raw);
    expect(clean).toBe('Line 1\n\nLine 2\n\nLine 3');
  });

  it('should strip common marketing tracking params from URLs', () => {
    const url = 'https://example.com/form?id=123&utm_source=fb&utm_campaign=summer&fbclid=abcdef';
    const clean = TextSanitizer.stripUrlTracking(url);
    expect(clean).toBe('https://example.com/form?id=123');
  });

  it('should return original string if not a valid URL', () => {
    expect(TextSanitizer.stripUrlTracking('invalid-url-string')).toBe('invalid-url-string');
  });

  it('should combine sanitization steps', () => {
    const raw = '  \u200BTest \u00A0String   \n\n  Next line   ';
    const clean = TextSanitizer.sanitize(raw);
    expect(clean).toBe('Test  String\n\nNext line');
  });
});
