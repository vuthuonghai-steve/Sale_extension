import { BaseCleaningStep } from './base-step';
import type { RawRecord, CleaningOptions } from '../types';

/**
 * PostSplitterStep
 * Tách nội dung file raw thành danh sách các khối bài đăng riêng biệt (RawRecord[])
 * dựa trên hoa hồng (🌹) hoặc mã quản lý (H105, H281...).
 */
export class PostSplitterStep extends BaseCleaningStep<RawRecord[] | string, RawRecord[]> {
  public readonly name = 'PostSplitterStep';

  public execute(input: RawRecord[] | string, _options?: CleaningOptions): RawRecord[] {
    if (!this.enabled) {
      return Array.isArray(input) ? input : [{ rawText: input }];
    }

    let fullText = '';
    if (typeof input === 'string') {
      fullText = input;
    } else if (Array.isArray(input)) {
      fullText = input.map((item) => String(item.rawText ?? item.content ?? '')).join('\n');
    }

    const lines = fullText.split(/\r?\n/);
    const records: RawRecord[] = [];

    let currentBlock: string[] = [];
    let lineStart = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Kiểm tra ranh giới phân cách bài đăng: dòng hoa hồng (🌹) hoặc mã quản lý dạng H<number>
      const isCommissionLine = /^🌹/.test(trimmed);
      const isManagerCodeLine = /^H\d+\b/i.test(trimmed);
      const isFullPostHeader = /FULL P\b|FULL ❌/i.test(trimmed);

      if ((isCommissionLine || isManagerCodeLine) && currentBlock.length > 0) {
        const text = currentBlock.join('\n').trim();
        if (text.length > 0) {
          records.push({
            rawText: text,
            sourceLineStart: lineStart,
            sourceLineEnd: i,
          });
        }
        currentBlock = [line];
        lineStart = i + 1;
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      const text = currentBlock.join('\n').trim();
      if (text.length > 0) {
        records.push({
          rawText: text,
          sourceLineStart: lineStart,
          sourceLineEnd: lines.length,
        });
      }
    }

    return records;
  }
}
