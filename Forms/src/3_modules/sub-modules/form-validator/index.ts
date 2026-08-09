import type { FormFieldDescriptor } from '@contracts';

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class FormValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly PHONE_REGEX = /^(?:\+84|0)[35789]\d{8}$/;

  public static validateField(
    field: FormFieldDescriptor,
    value: string | boolean | readonly string[] | undefined,
  ): ValidationResult {
    const errors: string[] = [];

    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (field.required && isEmpty) {
      errors.push(`Trường "${field.label || field.name}" là bắt buộc.`);
      return { isValid: false, errors };
    }

    if (isEmpty) {
      return { isValid: true, errors: [] };
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (field.type === 'email' && !this.EMAIL_REGEX.test(trimmed)) {
        errors.push(`Trường "${field.label || field.name}" phải là email hợp lệ.`);
      }

      if (field.type === 'phone' && !this.PHONE_REGEX.test(trimmed.replace(/\s+/g, ''))) {
        errors.push(`Trường "${field.label || field.name}" phải là số điện thoại hợp lệ.`);
      }

      if (field.type === 'number') {
        const num = Number(trimmed);
        if (Number.isNaN(num)) {
          errors.push(`Trường "${field.label || field.name}" phải là một số.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static validateAll(
    fields: readonly FormFieldDescriptor[],
    values: Record<string, string | boolean | readonly string[]>,
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};
    for (const field of fields) {
      results[field.id] = this.validateField(field, values[field.id]);
    }
    return results;
  }
}
