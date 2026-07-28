import { NormalizedMessage, RawJsonInputMessage, ServicePricing } from '../entities/normalized-message.entity';

/**
 * Normalization Service
 * Pure Domain Service responsible for parsing data_raw strings into structured NormalizedMessage entities.
 * Preserves data_raw 100% intact.
 */
export class DataNormalizationService {
  /**
   * Generates a deterministic content hash from data_raw text (ignoring spaces and case differences)
   */
  public generateContentHash(rawText: string): string {
    const cleaned = rawText.trim().toLowerCase().replace(/\s+/g, ' ');
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}_${cleaned.length}`;
  }

  /**
   * Normalizes a raw JSON message into a structured NormalizedMessage entity
   */
  public normalize(input: RawJsonInputMessage): NormalizedMessage {
    const rawText = input.data_raw || '';
    const contentHash = this.generateContentHash(rawText);

    return {
      id: input.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contentHash,
      data_raw: rawText,
      createdAt: new Date().toISOString(),
      code: this.parseCode(rawText),
      address: this.parseAddress(rawText),
      district: this.parseDistrict(rawText),
      availableRooms: this.parseAvailableRooms(rawText),
      priceRaw: this.parsePriceRaw(rawText),
      priceNumeric: this.parsePriceNumeric(rawText),
      roomType: this.parseRoomType(rawText),
      hasElevator: this.parseHasElevator(rawText),
      furniture: this.parseFurniture(rawText),
      services: this.parseServices(rawText),
      notes: this.parseNotes(rawText),
    };
  }

  private parseCode(text: string): string | null {
    const match = text.match(/Mã:\s*([A-Za-z0-9_-]+)/i);
    return match ? match[1].trim() : null;
  }

  private parseAddress(text: string): string | null {
    const match = text.match(/(?:🏠\s*)?Địa chỉ:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parseDistrict(text: string): string | null {
    const address = this.parseAddress(text) || text;
    const districts = [
      'Thanh Xuân', 'Đống Đa', 'Cầu Giấy', 'Ba Đình', 'Hai Bà Trưng',
      'Hoàn Kiếm', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Nam Từ Liêm',
      'Bắc Từ Liêm', 'Hà Đông', 'Gia Lâm', 'Đông Anh', 'Thanh Trì'
    ];
    for (const d of districts) {
      if (new RegExp(`\\b${d}\\b`, 'i').test(address)) {
        return d;
      }
    }
    return null;
  }

  private parseAvailableRooms(text: string): string | null {
    const match = text.match(/(?:⏰\s*)?Trống\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parsePriceRaw(text: string): string | null {
    const match = text.match(/(?:💰\s*)?Giá\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Converts raw price text like "4tr7", "4tr3 - 4tr6", "4tr990k", "5tr" into a numeric VND value.
   */
  public parsePriceNumeric(text: string): number | null {
    const priceRaw = this.parsePriceRaw(text);
    if (!priceRaw) return null;

    // Take the lower bound if price is a range e.g. "4tr3 - 4tr6" -> "4tr3"
    const firstPriceSegment = priceRaw.split('-')[0].trim();

    // Match "XtrY" e.g. 4tr7 -> 4,700,000; 4tr990k -> 4,990,000
    const trWithDecimalMatch = firstPriceSegment.match(/(\d+)\s*tr\s*(\d+)\s*k?/i);
    if (trWithDecimalMatch) {
      const millions = parseInt(trWithDecimalMatch[1], 10);
      let remainderStr = trWithDecimalMatch[2];
      if (remainderStr.length === 1) remainderStr = remainderStr + '00';
      else if (remainderStr.length === 2) remainderStr = remainderStr + '0';
      const remainder = parseInt(remainderStr, 10);
      return millions * 1_000_000 + remainder * 1_000;
    }

    // Match "Xtr" e.g. 5tr -> 5,000,000
    const trMatch = firstPriceSegment.match(/(\d+)\s*tr/i);
    if (trMatch) {
      return parseInt(trMatch[1], 10) * 1_000_000;
    }

    // Match raw digits e.g. 4700000
    const digitMatch = firstPriceSegment.replace(/\./g, '').match(/\d{6,8}/);
    if (digitMatch) {
      return parseInt(digitMatch[0], 10);
    }

    return null;
  }

  private parseRoomType(text: string): string | null {
    const match = text.match(/(?:👉\s*)?Phòng\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parseHasElevator(text: string): boolean {
    return /thang\s*máy/i.test(text);
  }

  private parseFurniture(text: string): string | null {
    const match = text.match(/(?:✅\s*)?Nội thất\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parseServices(text: string): ServicePricing {
    const match = text.match(/(?:✅\s*)?Dịch vụ\s*:\s*(.+)/i);
    if (!match) return {};

    const serviceText = match[1];
    const services: ServicePricing = {};

    const elecMatch = serviceText.match(/Điện\s*([^,;]+)/i);
    if (elecMatch) services.electricity = elecMatch[1].trim();

    const waterMatch = serviceText.match(/nước\s*([^,;]+)/i);
    if (waterMatch) services.water = waterMatch[1].trim();

    const mgmtMatch = serviceText.match(/(?:internet|vệ sinh|thang máy)\s*([^,;]+)/i);
    if (mgmtMatch) services.management = mgmtMatch[0].trim();

    const washMatch = serviceText.match(/máy giặt\s*([^,;]+)/i);
    if (washMatch) services.washingMachine = washMatch[1].trim();

    return services;
  }

  private parseNotes(text: string): string[] {
    const notes: string[] = [];
    const lines = text.split('\n');
    let isNoteSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/Lưu ý/i.test(trimmed)) {
        isNoteSection = true;
        continue;
      }
      if (isNoteSection) {
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('❌')) {
          notes.push(trimmed.replace(/^[-•❌]\s*/, ''));
        }
      }
    }
    return notes;
  }
}
