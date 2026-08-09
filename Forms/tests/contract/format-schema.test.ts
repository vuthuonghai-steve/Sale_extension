import { describe, it, expect } from 'vitest';
import { FormatSchemaDefinition } from '@contracts';
import skySchema from '../fixtures/schemas/a_sky_group.json';
import tl21Schema from '../fixtures/schemas/tl21_house.json';
import tnrSchema from '../fixtures/schemas/tnr_home.json';

describe('Format Schema Contract Validation', () => {
  it('validates a_sky_group.json matches FormatSchema contract', () => {
    const result = FormatSchemaDefinition.safeParse(skySchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('a_sky_group');
      expect(result.data.fields.length).toBeGreaterThan(0);
    }
  });

  it('validates tl21_house.json matches FormatSchema contract', () => {
    const result = FormatSchemaDefinition.safeParse(tl21Schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('tl21_house');
      expect(result.data.fields.length).toBeGreaterThan(0);
    }
  });

  it('validates tnr_home.json matches FormatSchema contract', () => {
    const result = FormatSchemaDefinition.safeParse(tnrSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('tnr_home');
      expect(result.data.fields.length).toBeGreaterThan(0);
    }
  });
});
