import { describe, expect, it } from 'vitest';
import { decodeSseChunk } from '../../../../src/3_modules/sub-modules/ai-stream-decoder/index';
import sseFixtures from './fixtures.json';

describe('ai-stream-decoder — AI-First Fixtures Managed Tests', () => {
  it.each(sseFixtures)(
    '$id: $description',
    ({ input, expected }) => {
      const result = decodeSseChunk(input);
      expect(result).toEqual(expected);
    }
  );
});
