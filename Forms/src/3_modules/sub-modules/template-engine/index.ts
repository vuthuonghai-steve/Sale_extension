import type { LeadEntity, FormatSchema } from '@contracts';

export class TemplateEngine {
  public static render(lead: LeadEntity, schema: FormatSchema): string {
    const lines: string[] = [];

    // 1. Header
    if (schema.headerTemplate && schema.headerTemplate.trim()) {
      lines.push(schema.headerTemplate.trim());
    }

    // 2. Fields
    for (const field of schema.fields) {
      let rawValue: string | undefined = undefined;

      // Cố định trường salesName (Tên CTV / Sales) nếu schema có defaultValues.salesName
      if (field.key === 'salesName' && schema.defaultValues?.salesName) {
        rawValue = schema.defaultValues.salesName.trim();
      } else {
        // Primary key lookup
        const primaryVal = (lead as Record<string, string | undefined>)[field.key];
        if (primaryVal !== undefined && primaryVal.trim() !== '') {
          rawValue = primaryVal.trim();
        }

        // Fallback key lookup
        if (!rawValue && field.fallbackTo) {
          const fallbackVal = (lead as Record<string, string | undefined>)[field.fallbackTo];
          if (fallbackVal !== undefined && fallbackVal.trim() !== '') {
            rawValue = fallbackVal.trim();
          }
        }

        // Default value lookup
        if (!rawValue && schema.defaultValues) {
          const defaultVal = schema.defaultValues[field.key];
          if (defaultVal !== undefined && defaultVal.trim() !== '') {
            rawValue = defaultVal.trim();
          }
        }
      }


      const prefix = field.prefix || '';
      const suffix = field.suffix || '';
      const finalVal = rawValue || '';

      lines.push(`${prefix}${finalVal}${suffix}`);
    }

    // 3. Footer
    if (schema.footerTemplate && schema.footerTemplate.trim()) {
      lines.push(schema.footerTemplate.trim());
    }

    return lines.join('\n');
  }

  public static renderAll(lead: LeadEntity, schemas: readonly FormatSchema[]): Record<string, string> {
    const outputs: Record<string, string> = {};
    for (const schema of schemas) {
      outputs[schema.id] = this.render(lead, schema);
    }
    return outputs;
  }
}
