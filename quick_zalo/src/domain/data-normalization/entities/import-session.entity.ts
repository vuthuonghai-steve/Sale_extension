export interface ImportSession {
  id: string;                        // UUID
  importedAt: string;                // ISO 8601
  sourceFileName: string;            // Tên file gốc
  totalMessages: number;
  uniqueListings: number;
  partialParsedCount: number;        // Số tin đánh dấu isPartiallyParsed
  templateBreakdown: {
    TNR: number;
    Sky: number;
    '95_Home': number;
    unknown: number;
  };
  status: 'completed' | 'partial' | 'failed';
  error?: string;
}
