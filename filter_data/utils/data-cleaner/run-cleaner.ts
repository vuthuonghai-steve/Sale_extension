import fs from 'fs';
import path from 'path';
import { DataCleanerManager } from './cleaner-manager';
import { PostSplitterStep } from './steps/post-splitter-step';
import { SanitizerStep } from './steps/sanitizer-step';
import { ListingParserStep } from './steps/listing-parser-step';
import { NormalizerStep } from './steps/normalizer-step';
import { FilterStep } from './steps/filter-step';
import { DeduplicateStep } from './steps/deduplicate-step';
import { saveSnapshotToFile, saveReportToFile } from '../../Data/Database/file-snapshot';
import type { RawRecord, CleanListingRecord } from './types';

function sanitizeUnicodeSurrogates(str: string): string {
  if (!str) return '';
  // Loại bỏ các ký tự surrogate đứng một mình hoặc không hợp lệ của UTF-16
  return str
    .replace(/\\udfe1/gi, '')
    .replace(/\\u[dD][89abAB][0-9a-fA-F]{2}\\u[dD][c-fC-F][0-9a-fA-F]{2}/g, '🏠')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g, '');
}

async function runDataCleaner() {
  console.log('🚀 Running Data Cleaner Pipeline...');

  const rawPath1 = path.join(process.cwd(), 'Data/95_home/1.md');
  const rawPath2 = path.join(process.cwd(), 'Data/sky_groub/1.md');

  const content1 = fs.readFileSync(rawPath1, 'utf-8');
  const content2 = fs.readFileSync(rawPath2, 'utf-8');

  const rawInputs: RawRecord[] = [
    { content: content1, source: '95_home/1.md' },
    { content: content2, source: 'sky_groub/1.md' },
  ];

  const manager = new DataCleanerManager([
    new PostSplitterStep(),
    new SanitizerStep(),
    new ListingParserStep(),
    new NormalizerStep(),
    new FilterStep(),
    new DeduplicateStep(),
  ]);

  const { data, report } = await manager.process(rawInputs);

  // Sanitize unicode surrogate characters
  const cleanRecords: CleanListingRecord[] = data.map((item) => {
    const rec = item as CleanListingRecord;
    return {
      ...rec,
      address: sanitizeUnicodeSurrogates(rec.address || ''),
      rawRef: sanitizeUnicodeSurrogates(rec.rawRef || ''),
    };
  });

  saveSnapshotToFile(cleanRecords);
  saveReportToFile(report);

  console.log(`✅ Pipeline execution completed! Saved ${cleanRecords.length} clean records to Data/Database/normalized_data_snapshot.json`);
}

runDataCleaner().catch(console.error);
