import { describe, expect, it } from 'vitest';
import { MessageDeduplicator } from './deduplicator.service';

describe('MessageDeduplicator', () => {
  it('should detect duplicate items and respect max capacity', () => {
    const deduplicator = new MessageDeduplicator(3);

    expect(deduplicator.isDuplicate('id-1')).toBe(false);
    deduplicator.markSeen('id-1');
    expect(deduplicator.isDuplicate('id-1')).toBe(true);

    deduplicator.markSeen('id-2');
    deduplicator.markSeen('id-3');
    expect(deduplicator.size).toBe(3);

    // Evict oldest (id-1) when adding 4th item
    deduplicator.markSeen('id-4');
    expect(deduplicator.isDuplicate('id-1')).toBe(false);
    expect(deduplicator.isDuplicate('id-4')).toBe(true);
  });

  it('should generate consistent hash for same parameters', () => {
    const deduplicator = new MessageDeduplicator();
    const hash1 = deduplicator.generateHash('Group A', 'Linh', '20:46', 'Mã L07 giá 5tr6');
    const hash2 = deduplicator.generateHash('Group A', 'Linh', '20:46', 'Mã L07 giá 5tr6');
    const hash3 = deduplicator.generateHash('Group A', 'Linh', '20:46', 'Mã L07 giá 6tr');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
