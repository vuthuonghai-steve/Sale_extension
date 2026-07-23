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
    const addressLabelMatch = rawText.match(
      /(?:📍|🏠|🕍|💒|Địa chỉ|địa chỉ|Vị trí)\s*:\s*([^\n]+)/i
    );
    if (addressLabelMatch) {
      return addressLabelMatch[1].trim();
    }

    const lines = rawText.split('\n');
    for (const line of lines) {
      if (
        /(?:Số\s+\d+|Ngõ\s+\d+|Ngách\s+\d+|Mặt\s+Phố|Đường|Khu\s+đô\ thị|LK\s+\d+)/i.test(line) &&
        !/Điện|Nước|Internet|Giá|Hoa\ hồng|🌹/i.test(line)
      ) {
        return line.replace(/^[📍🏠🕍💒✨👉\s]+/, '').trim();
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
    const rangeMatch = rawText.match(
      /(?:Giá|Giá\s*thuê|Giá\s*phòng|Giảm\s*giá)?\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)?\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)?/i
    );
    if (rangeMatch) {
      const min = this.parsePriceValue(rangeMatch[1]);
      const max = this.parsePriceValue(rangeMatch[2]);
      return { priceVnd: min, priceMaxVnd: max };
    }

    const singleMatch = rawText.match(
      /(?:Giá|Giá\s*thuê|Giá\s*phòng|Giảm\s*giá|đã\s*giảm)?\s*:\s*(\d+(?:[.,]\d+)*(?:\s*(?:tr|triệu|tr\/tháng|triệu\/tháng|đ|VNĐ))?)/i
    );
    if (singleMatch) {
      const parsed = this.parsePriceValue(singleMatch[1]);
      if (parsed) return { priceVnd: parsed };
    }

    return {};
  }

  private parsePriceValue(valStr: string): number | undefined {
    if (!valStr) return undefined;
    const clean = valStr.trim().toLowerCase();

    // Chuẩn hóa dấu phẩy thập phân thành dấu chấm (6,8 -> 6.8)
    const normalizedNumStr = clean.replace(',', '.');
    const num = parseFloat(normalizedNumStr);

    if (!isNaN(num)) {
      if (num < 100) {
        return Math.round(num * 1000000);
      }
      if (num >= 100000) {
        return Math.round(num);
      }
    }

    const digitsOnly = clean.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 6) {
      const parsedInt = parseInt(digitsOnly, 10);
      if (!isNaN(parsedInt)) return parsedInt;
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
        /(P\d{3}|Trục\s*\d+|Phòng\s+có\s+[^\n:]+|Studio|1N1K|2N1K|Duplex)\s*[:–-]?\s*(\d+(?:[.,]\d+)?\s*(?:tr|triệu|tr\/tháng|đ)?)/i
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
