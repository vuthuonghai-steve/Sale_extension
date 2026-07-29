import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';
import { TemplateDetectorService } from '@domain/data-normalization/services/template-detector.service';
import { MessageDeduplicationService } from '@domain/data-normalization/services/deduplication.service';
import { RawJsonInputMessage } from '@domain/data-normalization/entities/normalized-message.entity';

describe('Real Data Fixture Tests (Docs/Data/Raw/)', () => {
  const normalizer = new DataNormalizationService();
  const detector = new TemplateDetectorService();
  const dedupService = new MessageDeduplicationService(normalizer);

  const baseRawDir = resolve(process.cwd(), 'Docs/Data/Raw');

  const getRawMessages = (filePath: string): RawJsonInputMessage[] => {
    if (!existsSync(filePath)) {
      return [];
    }
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.messages)) return parsed.messages;
    return [];
  };

  it('should detect TNR messages with baseline accuracy (>40%) from real TNR fixture', () => {
    const filePath = resolve(
      baseRawDir,
      'TNR/zalo-messages-TNR_HOME_-_NGUỒN_TỔNG_HỢP_CTV_ĐÃ_CẮT_HH-20260728-214807.json'
    );
    const messages = getRawMessages(filePath);

    expect(messages.length).toBeGreaterThan(0);

    let tnrDetectedCount = 0;
    let totalNonEmpty = 0;

    for (const msg of messages) {
      if (!msg.data_raw || msg.data_raw.trim() === '') continue;
      totalNonEmpty++;
      const detected = detector.detect(msg.data_raw);
      if (detected === 'TNR') {
        tnrDetectedCount++;
      }
    }

    expect(totalNonEmpty).toBeGreaterThan(0);
    const detectionRate = tnrDetectedCount / totalNonEmpty;
    // Empirical baseline on real TNR raw fixture is ~48.8%
    expect(detectionRate).toBeGreaterThan(0.4);
  });

  it('should detect Sky Group messages with baseline accuracy (>25%) from real Sky fixture', () => {
    const filePath = resolve(
      baseRawDir,
      'sky_groub/zalo-messages-Phòng_Trống_Sky_Group-20260728-213709.json'
    );
    const messages = getRawMessages(filePath);

    expect(messages.length).toBeGreaterThan(0);

    let skyDetectedCount = 0;
    let totalNonEmpty = 0;

    for (const msg of messages) {
      if (!msg.data_raw || msg.data_raw.trim() === '') continue;
      totalNonEmpty++;
      const detected = detector.detect(msg.data_raw);
      if (detected === 'Sky') {
        skyDetectedCount++;
      }
    }

    expect(totalNonEmpty).toBeGreaterThan(0);
    const detectionRate = skyDetectedCount / totalNonEmpty;
    // Empirical baseline on real Sky Group raw fixture is ~29.5%
    expect(detectionRate).toBeGreaterThan(0.25);
  });

  it('should detect 95 Home messages with baseline accuracy (>40%) from real 95 Home fixture', () => {
    const filePath = resolve(
      baseRawDir,
      '95_home/zalo-messages-NGUỒN_HÀNG_95_HOME-20260728-212809.json'
    );
    const messages = getRawMessages(filePath);

    expect(messages.length).toBeGreaterThan(0);

    let detected95Count = 0;
    let totalNonEmpty = 0;

    for (const msg of messages) {
      if (!msg.data_raw || msg.data_raw.trim() === '') continue;
      totalNonEmpty++;
      const detected = detector.detect(msg.data_raw);
      if (detected === '95_Home') {
        detected95Count++;
      }
    }

    expect(totalNonEmpty).toBeGreaterThan(0);
    const detectionRate = detected95Count / totalNonEmpty;
    // Empirical baseline on real 95 Home raw fixture is ~43.4%
    expect(detectionRate).toBeGreaterThan(0.4);
  });

  it('should normalize and deduplicate 1000+ real raw messages without throwing any unhandled exceptions', () => {
    const tnrPath = resolve(
      baseRawDir,
      'TNR/zalo-messages-TNR_HOME_-_NGUỒN_TỔNG_HỢP_CTV_ĐÃ_CẮT_HH-20260728-214807.json'
    );
    const messages = getRawMessages(tnrPath);

    expect(messages.length).toBeGreaterThan(0);

    expect(() => {
      const result = dedupService.deduplicateFileInput(messages);
      expect(result.uniqueMessages.length + result.dupesInFile).toBeLessThanOrEqual(messages.length);
    }).not.toThrow();
  });
});
