import type { ZaloMessage } from '@domain/message-extraction/entities/zalo-message.entity';

export function exportMessagesAsJson(messages: ZaloMessage[], filename: string): void {
  const exportData = {
    messages: messages.map((m) => ({
      id: m.id,
      data_raw: m.rawText,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function buildExportFilename(conversationName: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const safeName = conversationName
    .replace(/[^a-zA-Z0-9_\-\p{L}]/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);

  return `zalo-messages-${safeName || 'unknown'}-${dateStr}.json`;
}
