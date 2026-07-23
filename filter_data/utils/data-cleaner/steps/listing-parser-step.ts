import { BaseCleaningStep } from './base-step';
import type { RawRecord, CleanListingRecord, CleaningOptions } from '../types';

/**
 * ListingParserStep
 * Bóc tách trường dữ liệu bằng Regex từ văn bản thô.
 * Xử lý bài đăng Multi-tier (nhiều mức giá / nhiều loại phòng) thành các bản ghi phòng riêng biệt.
 */
export class ListingParserStep extends BaseCleaningStep<RawRecord[], CleanListingRecord[]> {
  public readonly name = 'ListingParserStep';

  public execute(input: RawRecord[], _options?: CleaningOptions): CleanListingRecord[] {
    if (!this.enabled) return [];

    const results: CleanListingRecord[] = [];

    for (let index = 0; index < input.length; index++) {
      const record = input[index];
      const rawText = String(record.rawText ?? '');
      if (!rawText.trim()) continue;

      const baseRecord = this.parseBaseFields(rawText, index);
      const multiTierRooms = this.extractMultiTierRooms(rawText);

      if (multiTierRooms.length > 1) {
        // Tách thành N bản ghi con ứng với từng phòng / trục phòng
        for (let subIdx = 0; subIdx < multiTierRooms.length; subIdx++) {
          const roomInfo = multiTierRooms[subIdx];
          results.push({
            ...baseRecord,
            id: `${baseRecord.id}_tier_${subIdx + 1}`,
            roomType: roomInfo.roomType || baseRecord.roomType,
            priceVnd: roomInfo.priceVnd || baseRecord.priceVnd,
            priceMaxVnd: roomInfo.priceMaxVnd || baseRecord.priceMaxVnd,
            rawRef: rawText,
          });
        }
      } else {
        results.push(baseRecord);
      }
    }

    return results;
  }

  private parseBaseFields(rawText: string, index: number): CleanListingRecord {
    // 1. Commission (Hoa hồng)
    let commission = '';
    const commissionMatch = rawText.match(/🌹\s*([^\n]+)/);
    if (commissionMatch) {
      commission = commissionMatch[1].trim();
    }

    // 2. Manager Code (Mã quản lý)
    let managerCode = '';
    const managerMatch = rawText.match(/\b(H\d{1,4})\b/i);
    if (managerMatch) {
      managerCode = managerMatch[1].toUpperCase();
    }

    // 3. Address extraction
    const address = this.extractAddress(rawText);

    // 4. Room Type
    const roomType = this.extractRoomType(rawText);

    // 5. Area (m²)
    const areaSqm = this.extractArea(rawText);

    // 6. Available Date
    const availableDate = this.extractAvailableDate(rawText);

    // 7. Base Price
    const { priceVnd, priceMaxVnd } = this.extractPrice(rawText);

    // 8. Is Full / Out of stock check
    const isFull = /FULL P\b|FULL ❌/i.test(rawText);

    return {
      id: `rec_${Date.now()}_${index}`,
      managerCode,
      commission,
      address,
      roomType,
      areaSqm,
      availableDate,
      priceVnd,
      priceMaxVnd,
      isFull,
      rawRef: rawText,
    };
  }

  private extractAddress(rawText: string): string {
    const zaloHeaderRegex =
      /^\[(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?|\d{1,2}:\d{2}(?::\d{2})?,\s*\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\]\s*[^:\n]*:\s*/;

    const cleanLine = (text: string) =>
      text
        .replace(zaloHeaderRegex, '')
        .replace(/^[📍🏠🕍💒✨👉\s]+/, '')
        .replace(/\s*FULL P.*$/i, '')
        .trim();

    const addressLabelMatch = rawText.match(
      /(?:📍|🏠|🕍|💒|Địa chỉ|địa chỉ|Vị trí)\s*:\s*([^\n]+)/i
    );
    if (addressLabelMatch) {
      return cleanLine(addressLabelMatch[1]);
    }

    const lines = rawText.split('\n');
    for (const line of lines) {
      const strippedLine = line.replace(zaloHeaderRegex, '').trim();
      if (
        /(?:Số\s+\d+|Ngõ\s+\d+|Ngách\s+\d+|Mặt\s+Phố|Đường|Khu\s+đô\ thị|LK\s+\d+|\b\d{1,4}\/\d+|\b\d{1,4}\s+[A-ZÀ-Ỹa-zà-ỹ])/i.test(strippedLine) &&
        !/Điện|Nước|Internet|Giá|Hoa\ hồng|🌹/i.test(strippedLine)
      ) {
        return cleanLine(strippedLine);
      }
    }

    return '';
  }

  private extractRoomType(rawText: string): string {
    if (/\bStudio\b/i.test(rawText)) return 'Studio';
    if (/\b3N1K\b/i.test(rawText)) return '3N1K';
    if (/\b2N1K\b/i.test(rawText)) return '2N1K';
    if (/\b1N1K\b/i.test(rawText)) return '1N1K';
    if (/\bDuplex\b/i.test(rawText)) return 'Duplex';
    if (/\bGác\s*xép\b/i.test(rawText)) return 'Gác xép';
    return '';
  }

  private extractArea(rawText: string): number | undefined {
    const areaMatch = rawText.match(/(\d+)\s*(?:m²|m2|mét\s*vuông)\b/i);
    if (areaMatch) {
      return parseInt(areaMatch[1], 10);
    }
    return undefined;
  }

  private extractAvailableDate(rawText: string): string {
    if (/ở\s*được\s*luôn|ở\s*luôn/i.test(rawText)) return 'Ở luôn';
    const dateMatch = rawText.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*(?:trống|vào|ở)/i);
    if (dateMatch) {
      return dateMatch[1];
    }
    return '';
  }

  private extractPrice(rawText: string): { priceVnd?: number; priceMaxVnd?: number } {
    const lines = rawText.split(/\r?\n/);
    const validPrices: number[] = [];

    const skipKeywords = [
      'điện', 'nước', 'wifi', 'mạng', 'dịch vụ', 'dvc', 'giặt', 'sấy',
      'bảo trì', 'rác', 'xe', 'sạc', 'phí gửi', 'diện tích', 'cọc', 'sđt', 'liên hệ'
    ];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (skipKeywords.some((kw) => lower.includes(kw))) continue;

      const hasPriceHeader = /[💵💰💸💲🏷️]|\bgiá\b/i.test(line);

      const priceTokens = line.match(
        /\b(?:\d+\s*tr\s*\d+|\d+(?:[.,]\d+)?\s*(?:tr|triệu|tr\/tháng|triệu\/tháng)|(?:\d{1,2}(?:\.\d{3})+|\d{4,5})\s*k|\d{7,9})\b/gi
      );

      if (priceTokens && priceTokens.length > 0) {
        for (const token of priceTokens) {
          const val = this.parsePriceValue(token);
          if (val && val >= 1000000 && val <= 100000000) {
            validPrices.push(val);
          }
        }
        if (validPrices.length > 0 && hasPriceHeader) {
          break;
        }
      }
    }

    if (validPrices.length === 0) {
      return {};
    }

    if (validPrices.length === 1) {
      return { priceVnd: validPrices[0] };
    }

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice === maxPrice) {
      return { priceVnd: minPrice };
    }

    return { priceVnd: minPrice, priceMaxVnd: maxPrice };
  }

  private parsePriceValue(valStr: string): number | undefined {
    if (!valStr) return undefined;
    const clean = valStr.trim().toLowerCase();

    // 1. Dạng "4tr2", "3tr650", "4tr200"
    const trCombinedMatch = clean.match(/^(\d+)\s*tr\s*(\d+)$/);
    if (trCombinedMatch) {
      const main = parseInt(trCombinedMatch[1], 10);
      const subStr = trCombinedMatch[2];
      let sub = 0;
      if (subStr.length === 1) {
        sub = parseInt(subStr, 10) * 100000;
      } else if (subStr.length === 2) {
        sub = parseInt(subStr, 10) * 10000;
      } else if (subStr.length === 3) {
        sub = parseInt(subStr, 10) * 1000;
      } else {
        sub = parseInt(subStr, 10);
      }
      return main * 1000000 + sub;
    }

    // 2. Dạng "4tr", "4.2tr", "4,2tr", "4.2 triệu"
    const trMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)\b/);
    if (trMatch) {
      const num = parseFloat(trMatch[1].replace(',', '.'));
      if (!isNaN(num)) {
        return Math.round(num * 1000000);
      }
    }

    // 3. Dạng "4200k", "4.200k"
    const kMatch = clean.match(/^(\d+(?:\.\d{3})?)\s*k\b/);
    if (kMatch) {
      const numStr = kMatch[1].replace(/\./g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num >= 1000) {
        return num * 1000;
      }
    }

    // 4. Số đầy đủ "4.200.000", "4200000"
    const digitsOnly = clean.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 7) {
      const parsedInt = parseInt(digitsOnly, 10);
      if (!isNaN(parsedInt) && parsedInt >= 1000000 && parsedInt <= 100000000) {
        return parsedInt;
      }
    }

    return undefined;
  }

  private extractMultiTierRooms(
    rawText: string
  ): Array<{ roomType?: string; priceVnd?: number; priceMaxVnd?: number }> {
    const multiTierList: Array<{ roomType?: string; priceVnd?: number; priceMaxVnd?: number }> = [];

    const lines = rawText.split('\n');
    for (const line of lines) {
      const tierMatch = line.match(
        /(P\d{3}|Trục\s*\d+|Phòng\s+có\s+[^\n:]+|Studio|1N1K|2N1K|Duplex)\s*[:–-]?\s*(\d+\s*tr\s*\d+|\d+(?:[.,]\d+)?\s*(?:tr|triệu|tr\/tháng|đ)?)/i
      );
      if (tierMatch && !line.includes('Điện') && !line.includes('Nước') && !line.includes('Dịch vụ')) {
        const typeStr = tierMatch[1].trim();
        const priceVal = this.parsePriceValue(tierMatch[2]);
        if (priceVal && priceVal >= 1000000) {
          multiTierList.push({
            roomType: typeStr,
            priceVnd: priceVal,
          });
        }
      }
    }

    return multiTierList;
  }
}
