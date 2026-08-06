import fs from 'fs';
import path from 'path';
import type { CleanListingRecord, CleaningReport } from '../../utils/data-cleaner/types';

const SNAPSHOT_FILE_PATH = path.join(process.cwd(), 'Data/Database/normalized_data_snapshot.json');
const REPORT_FILE_PATH = path.join(process.cwd(), 'Data/Database/cleaning_report.json');

/**
 * Persist clean listing records snapshot directly into the Data/Database folder as JSON file.
 */
export function saveSnapshotToFile(
  records: CleanListingRecord[],
  filePath: string = SNAPSHOT_FILE_PATH
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonContent = JSON.stringify(records, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf-8');
}

/**
 * Load clean listing records snapshot from file.
 */
export function loadSnapshotFromFile(filePath: string = SNAPSHOT_FILE_PATH): CleanListingRecord[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CleanListingRecord[];
}

/**
 * Persist cleaning report log to Data/Database folder.
 */
export function saveReportToFile(
  report: CleaningReport,
  filePath: string = REPORT_FILE_PATH
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonContent = JSON.stringify(report, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf-8');
}
