import { z } from 'zod';

export const FormatFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  prefix: z.string().default(''),
  suffix: z.string().default(''),
  fallbackTo: z.string().optional(),
  required: z.boolean().default(false),
});

export type FormatField = z.infer<typeof FormatFieldSchema>;

export const FormatSchemaDefinition = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().default('📋'),
  description: z.string().optional(),
  headerTemplate: z.string().default(''),
  footerTemplate: z.string().default(''),
  defaultValues: z.record(z.string(), z.string()).default({}),
  fields: z.array(FormatFieldSchema),
});

export type FormatSchema = z.infer<typeof FormatSchemaDefinition>;
