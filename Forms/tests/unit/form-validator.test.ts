import { describe, it, expect } from 'vitest';
import { FormValidator } from '../../src/3_modules/sub-modules/form-validator/index.ts';
import type { FormFieldDescriptor } from '../../src/0_contracts/form-contract.ts';

describe('FormValidator', () => {
  it('should validate required fields properly', () => {
    const field: FormFieldDescriptor = {
      id: 'name',
      name: 'name',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    };

    expect(FormValidator.validateField(field, '').isValid).toBe(false);
    expect(FormValidator.validateField(field, undefined).isValid).toBe(false);
    expect(FormValidator.validateField(field, 'Nguyễn Văn A').isValid).toBe(true);
  });

  it('should validate email fields', () => {
    const field: FormFieldDescriptor = {
      id: 'email',
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    };

    expect(FormValidator.validateField(field, 'invalid-email').isValid).toBe(false);
    expect(FormValidator.validateField(field, 'user@domain.com').isValid).toBe(true);
  });

  it('should validate phone fields', () => {
    const field: FormFieldDescriptor = {
      id: 'phone',
      name: 'phone',
      label: 'Phone',
      type: 'phone',
      required: false,
    };

    expect(FormValidator.validateField(field, '').isValid).toBe(true);
    expect(FormValidator.validateField(field, '12345').isValid).toBe(false);
    expect(FormValidator.validateField(field, '0987654321').isValid).toBe(true);
    expect(FormValidator.validateField(field, '+84987654321').isValid).toBe(true);
  });

  it('should validate number fields', () => {
    const field: FormFieldDescriptor = {
      id: 'age',
      name: 'age',
      label: 'Tuổi',
      type: 'number',
      required: true,
    };

    expect(FormValidator.validateField(field, 'abc').isValid).toBe(false);
    expect(FormValidator.validateField(field, '25').isValid).toBe(true);
  });

  it('should validate multiple fields in batch', () => {
    const fields: FormFieldDescriptor[] = [
      { id: 'f1', name: 'name', label: 'Name', type: 'text', required: true },
      { id: 'f2', name: 'email', label: 'Email', type: 'email', required: true },
    ];

    const results = FormValidator.validateAll(fields, {
      f1: 'Alex',
      f2: 'alex@example.com',
    });

    expect(results['f1']?.isValid).toBe(true);
    expect(results['f2']?.isValid).toBe(true);
  });
});
