import type { FormFieldDescriptor, FormFillInstruction } from '@contracts';
import { TextSanitizer } from '../text-sanitizer/index.ts';

export class FormMatcher {
  public static normalizeKey(key: string): string {
    return TextSanitizer.removeHiddenChars(key)
      .toLowerCase()
      .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, '')
      .trim();
  }

  public static matchField(
    field: FormFieldDescriptor,
    data: Record<string, string | boolean | readonly string[]>,
  ): string | boolean | readonly string[] | undefined {
    // 1. Direct ID / Name match
    if (data[field.id] !== undefined) return data[field.id];
    if (data[field.name] !== undefined) return data[field.name];

    // 2. Normalized label match
    const normLabel = this.normalizeKey(field.label);
    if (!normLabel) return undefined;

    for (const [key, val] of Object.entries(data)) {
      const normKey = this.normalizeKey(key);
      if (normKey === normLabel || normKey.includes(normLabel) || normLabel.includes(normKey)) {
        return val;
      }
    }

    return undefined;
  }

  public static generateFillInstructions(
    fields: readonly FormFieldDescriptor[],
    data: Record<string, string | boolean | readonly string[]>,
  ): FormFillInstruction[] {
    const instructions: FormFillInstruction[] = [];

    for (const field of fields) {
      const matchedValue = this.matchField(field, data);
      if (matchedValue !== undefined) {
        instructions.push({
          fieldId: field.id,
          value: typeof matchedValue === 'string' ? TextSanitizer.sanitize(matchedValue) : matchedValue,
        });
      }
    }

    return instructions;
  }
}
