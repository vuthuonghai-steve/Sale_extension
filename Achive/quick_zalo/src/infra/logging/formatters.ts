import type { AgenticLogEntry, LogLevel } from '../../shared/types/evlog.types';

const PII_KEYS = ['password', 'token', 'secret', 'authorization', 'bearer', 'creditcard', 'apikey'];

export function sanitizePII(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map(sanitizePII);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const isSensitive = PII_KEYS.some((pii) => key.toLowerCase().includes(pii));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_PII]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePII(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function formatConsoleStyle(entry: AgenticLogEntry): {
  messageString: string;
  styles: string[];
} {
  const levelColors: Record<LogLevel, string> = {
    DEBUG: 'color: #7f8c8d; font-weight: bold;',
    INFO: 'color: #2ecc71; font-weight: bold;',
    WARN: 'color: #f39c12; font-weight: bold;',
    ERROR: 'color: #e74c3c; font-weight: bold;',
    FATAL: 'color: #ffffff; background-color: #c0392b; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  };

  const messageString = `%c[${entry.timestamp}] [%c${entry.level}%c] [${entry.scope}] (${entry.file_line}): ${entry.decision_reason}`;
  const styles = [
    'color: #95a5a6;',
    levelColors[entry.level],
    'color: inherit;',
  ];

  return { messageString, styles };
}

export function getFileLineCoordinate(errorStack?: string): string {
  if (!errorStack) {
    const stack = new Error().stack;
    if (!stack) return 'unknown:0';
    return parseStackLine(stack, 3);
  }
  return parseStackLine(errorStack, 1);
}

function parseStackLine(stack: string, targetLineIndex: number): string {
  const lines = stack.split('\n');
  const candidate = lines[targetLineIndex] || lines[lines.length - 1] || '';
  const match = candidate.match(/(?:src\/|entrypoints\/|at\s+)([^\s()]+\.[a-z0-9]+:\d+)/i);
  return match ? match[1] : 'src/app/main.ts:1';
}
