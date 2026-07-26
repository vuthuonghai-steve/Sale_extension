import { describe, it, expect } from 'vitest';
import { validateContact } from './contact-validator';

describe('Contact Validator (@domain/crm)', () => {
  it('should validate valid contact data', () => {
    const res = validateContact({ name: ' Nguyen Van A ', phone: '+84987654321' });
    expect(res.isOk).toBe(true);
    if (res.isOk) {
      expect(res.value.name).toBe('Nguyen Van A');
      expect(res.value.phone).toBe('+84987654321');
    }
  });

  it('should fail when name is empty', () => {
    const res = validateContact({ name: '', phone: '0987654321' });
    expect(res.isErr).toBe(true);
    if (res.isErr) {
      expect(res.error.code).toBe('VALIDATION');
      expect(res.error.message).toContain('name is required');
    }
  });

  it('should fail when phone format is invalid', () => {
    const res = validateContact({ name: 'Alice', phone: 'invalid-phone' });
    expect(res.isErr).toBe(true);
    if (res.isErr) {
      expect(res.error.code).toBe('VALIDATION');
      expect(res.error.message).toContain('Invalid contact phone number');
    }
  });
});
