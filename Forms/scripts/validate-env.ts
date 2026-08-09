import { readFileSync } from 'node:fs';
import { validateEnv } from '../src/0_contracts/config-schema.ts';

const mode =
  process.argv.find((a) => a.startsWith('--mode='))?.slice('--mode='.length) ?? 'development';
const file = `.env.${mode}`;
const raw = readFileSync(file, 'utf-8');
const vars: Record<string, string> = {};
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) vars[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, '');
}
validateEnv(vars);
process.stdout.write(`[env] ${file} hợp lệ (${Object.keys(vars).length} biến)\n`);
