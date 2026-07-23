import { BaseCleaningStep } from './base-step';
import type { RawRecord, CleaningOptions } from '../types';

/**
 * PostSplitterStep
 * Tách nội dung file raw thành danh sách các khối bài đăng riêng biệt (RawRecord[])
 * dựa trên Zalo timestamp header, hoa hồng (🌹), mã quản lý (H105, H281...) hoặc dòng báo FULL P.
 */
export class PostSplitterStep extends BaseCleaningStep<RawRecord[] | string, RawRecord[]> {
  public readonly name = 'PostSplitterStep';

  private static readonly ZALO_HEADER_REGEX =
    /^\[(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?|\d{1,2}:\d{2}(?::\d{2})?,\s*\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\]\s*[^:\n]*:/;

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
      if (!trimmed) {
        if (currentBlock.length > 0) {
          currentBlock.push(line);
        }
        continue;
      }

      const isZaloHeader = PostSplitterStep.ZALO_HEADER_REGEX.test(trimmed);
      const stripped = trimmed.replace(PostSplitterStep.ZALO_HEADER_REGEX, '').trim();

      const isCommissionLine = /^🌹|🌹\s*\d+%?|^\/-(?:rose|heart|strong|sun)/i.test(stripped);
      const isManagerCodeLine = /^H\d+\b/i.test(stripped);
      const isFullPLine = /\bFULL P\b|FULL ❌/i.test(stripped);

      const blockTextWithoutCommission = currentBlock
        .filter((l) => {
          const s = l.trim().replace(PostSplitterStep.ZALO_HEADER_REGEX, '').trim();
          return !/^🌹|^\/-(?:rose|heart|strong|sun)/i.test(s) && s.length > 0;
        })
        .join('');
      const currentBlockHasSubstantiveContent = blockTextWithoutCommission.length > 0;

      let shouldSplit = false;

      if (currentBlock.length > 0) {
        if (isZaloHeader) {
          shouldSplit = true;
        } else if (isManagerCodeLine && currentBlockHasSubstantiveContent) {
          shouldSplit = true;
        } else if (isCommissionLine && currentBlockHasSubstantiveContent) {
          shouldSplit = true;
        } else if (isFullPLine && currentBlockHasSubstantiveContent && (stripped.length < 80 || /^số\s+\d+/i.test(stripped))) {
          // Tách dòng báo FULL P độc lập ngắn hoặc có dạng 'số XX ngõ YY...'
          shouldSplit = true;
        }
      }

      if (shouldSplit) {
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

