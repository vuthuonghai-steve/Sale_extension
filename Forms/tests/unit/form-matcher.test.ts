import { describe, it, expect } from 'vitest';
import { FormMatcher } from '../../src/3_modules/sub-modules/form-matcher/index.ts';
import type { FormFieldDescriptor } from '../../src/0_contracts/form-contract.ts';

describe('FormMatcher', () => {
  it('should match field by direct ID', () => {
    const field: FormFieldDescriptor = {
      id: 'fullName',
      name: 'name_input',
      label: 'Nhập Họ và tên',
      type: 'text',
      required: true,
    };

    const data = { fullName: 'Steve Jobs' };
    const res = FormMatcher.matchField(field, data);
    expect(res).toBe('Steve Jobs');
  });

  it('should match field by normalized label', () => {
    const field: FormFieldDescriptor = {
      id: 'field_999',
      name: 'input_999',
      label: 'Họ và tên *',
      type: 'text',
      required: true,
    };

    const data = { 'Họ và tên': 'Elon Musk' };
    const res = FormMatcher.matchField(field, data);
    expect(res).toBe('Elon Musk');
  });

  it('should generate fill instructions correctly with sanitization', () => {
    const fields: FormFieldDescriptor[] = [
      { id: 'f1', name: 'f1', label: 'Họ và tên', type: 'text', required: true },
      { id: 'f2', name: 'f2', label: 'Email', type: 'email', required: true },
      { id: 'f3', name: 'f3', label: 'Địa chỉ', type: 'text', required: false },
    ];

    const data = {
      'Họ và tên': '  Nguyễn \u200BVăn B   ',
      Email: 'b@example.com',
    };

    const instructions = FormMatcher.generateFillInstructions(fields, data);
    expect(instructions).toHaveLength(2);
    expect(instructions[0]).toEqual({
      fieldId: 'f1',
      value: 'Nguyễn Văn B',
    });
    expect(instructions[1]).toEqual({
      fieldId: 'f2',
      value: 'b@example.com',
    });
  });

  it('should match field by name property and non-string values', () => {
    const field: FormFieldDescriptor = {
      id: 'custom_id_123',
      name: 'is_active',
      label: 'Trạng thái',
      type: 'checkbox',
      required: false,
    };
    const data = { is_active: true };
    const res = FormMatcher.matchField(field, data);
    expect(res).toBe(true);

    const instructions = FormMatcher.generateFillInstructions([field], data);
    expect(instructions[0]).toEqual({ fieldId: 'custom_id_123', value: true });
  });

  it('should return undefined when label is empty or no match found', () => {
    const field: FormFieldDescriptor = {
      id: 'id_empty',
      name: 'name_empty',
      label: '   ',
      type: 'text',
      required: false,
    };
    expect(FormMatcher.matchField(field, { key: 'val' })).toBeUndefined();
  });
});

