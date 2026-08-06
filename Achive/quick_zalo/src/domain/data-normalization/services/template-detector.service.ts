/**
 * Template Detector Service
 * Pure Domain Service responsible for identifying template families (TNR, Sky Group, 95 Home)
 * from raw message strings using heuristic rule matching.
 */

import type { TemplateFamily } from '../entities/normalized-listing.entity';

export type { TemplateFamily };

export class TemplateDetectorService {
  /**
   * Detects the template family from raw text data.
   * Returns 'TNR' | 'Sky' | '95_Home' if a structured template matches, or null if free_text/unknown.
   */
  public detect(data_raw: string): TemplateFamily | null {
    if (!data_raw || typeof data_raw !== 'string' || data_raw.trim().length === 0) {
      return null;
    }

    const text = data_raw.trim();

    // High confidence direct markers
    if (this.isSkyGroup(text)) {
      return 'Sky';
    }

    if (this.is95Home(text)) {
      return '95_Home';
    }

    if (this.isTNR(text)) {
      return 'TNR';
    }

    // Secondary scoring check for edge cases
    const scores = {
      Sky: this.scoreSky(text),
      '95_Home': this.score95Home(text),
      TNR: this.scoreTNR(text),
    };

    let bestFamily: TemplateFamily | null = null;
    let maxScore = 0;

    for (const [family, score] of Object.entries(scores) as [TemplateFamily, number][]) {
      if (score > maxScore) {
        maxScore = score;
        bestFamily = family;
      }
    }

    // Require at least a score of 2 to classify as structured template
    if (maxScore >= 2 && bestFamily) {
      return bestFamily;
    }

    return null;
  }

  private isSkyGroup(text: string): boolean {
    // /-rose is unique to Sky Group
    if (/\/-rose/i.test(text)) {
      return true;
    }
    // Combo signature for Sky
    if (/☘️\s*Phí\s*d/i.test(text) && /💥\s*Nội\s*thất/i.test(text)) {
      return true;
    }
    return false;
  }

  private is95Home(text: string): boolean {
    // KHAI TRƯƠNG or 🕌 Địa chỉ or 🌹 header is unique to 95 Home
    if (/(?:KHAI\s*TRƯƠNG|Khai\s*trương)/i.test(text) && / Quận| Quận| Địa chỉ/i.test(text)) {
      return true;
    }
    if (/🕌\s*Địa\s*chỉ/i.test(text)) {
      return true;
    }
    if (/⚡\s*Chi\s*phí\s*dịch\s*vụ/i.test(text)) {
      return true;
    }
    // 🌹 followed by percentage e.g. 🌹30% or 🌹 35%
    if (/🌹\s*\d+\s*%/i.test(text)) {
      return true;
    }
    return false;
  }

  private isTNR(text: string): boolean {
    // TNR standard markers: Mã A1204 / Mã B90 + dvc / ✅ Dịch vụ + 🏠 Địa chỉ
    const hasCode = /^\s*l?Mã\s*[A-Za-z0-9]/i.test(text) || /Mã\s*[A-Z]\d+/i.test(text);
    const hasAddress = /🏠\s*Địa\s*chỉ/i.test(text);
    const hasDvc = /dvc\s*\d+k/i.test(text) || /✅\s*Dịch\s*vụ/i.test(text);
    const hasRoomType = /👉\s*Phòng\s*:/i.test(text);

    if (hasCode && (hasAddress || hasDvc || hasRoomType)) {
      return true;
    }

    if (hasAddress && hasDvc && hasRoomType) {
      return true;
    }

    return false;
  }

  private scoreSky(text: string): number {
    let score = 0;
    if (/\/-rose/i.test(text)) score += 3;
    if (/☘️\s*Phí/i.test(text)) score += 1;
    if (/💥\s*Nội\s*thất/i.test(text)) score += 1;
    if (/⛳️\s*Diện\s*tích/i.test(text) || /🚩\s*Diện\s*tích/i.test(text)) score += 1;
    if (/🚫\s*Không/i.test(text)) score += 1;
    return score;
  }

  private score95Home(text: string): number {
    let score = 0;
    if (/🌹/i.test(text)) score += 2;
    if (/KHAI\s*TRƯƠNG/i.test(text)) score += 2;
    if (/🕌\s*Địa\s*chỉ/i.test(text)) score += 2;
    if (/⚡\s*Chi\s*phí/i.test(text)) score += 1;
    if (/📍\s*Khu\s*vực/i.test(text)) score += 1;
    if (/Trục\s*ngoài|Trục\s*trong/i.test(text)) score += 1;
    return score;
  }

  private scoreTNR(text: string): number {
    let score = 0;
    if (/^\s*l?Mã\s*[A-Z]\d+/i.test(text)) score += 2;
    if (/🏠\s*Địa\s*chỉ/i.test(text)) score += 1;
    if (/⏰\s*Trống/i.test(text)) score += 1;
    if (/👉\s*Phòng/i.test(text)) score += 1;
    if (/👉\s*Thang/i.test(text)) score += 1;
    if (/dvc\s*\d+k/i.test(text)) score += 2;
    if (/❌\s*Lưu\s*ý/i.test(text)) score += 1;
    return score;
  }
}
