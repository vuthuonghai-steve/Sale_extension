import { z } from 'zod';

export const EnvSchema = z.object({
  WXT_APP_NAME: z.string().min(1, 'WXT_APP_NAME is required'),
  WXT_APP_DESCRIPTION: z.string().min(1, 'WXT_APP_DESCRIPTION is required'),
  WXT_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined>): EnvConfig {
  return EnvSchema.parse(rawEnv);
}
