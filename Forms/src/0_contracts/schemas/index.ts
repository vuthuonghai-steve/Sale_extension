import type { FormatSchema } from '../format-schema.ts';
import { aSkyGroupSchema } from './a-sky-group.schema.ts';
import { tl21HouseSchema } from './tl21-house.schema.ts';
import { tnrHomeSchema } from './tnr-home.schema.ts';

export * from './a-sky-group.schema.ts';
export * from './tl21-house.schema.ts';
export * from './tnr-home.schema.ts';

export const DEFAULT_FORMAT_SCHEMAS: readonly FormatSchema[] = [
  aSkyGroupSchema,
  tl21HouseSchema,
  tnrHomeSchema,
];
