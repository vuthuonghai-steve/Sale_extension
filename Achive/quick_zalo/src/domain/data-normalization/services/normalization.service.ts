import { NormalizedMessage, RawJsonInputMessage, ServicePricing } from '../entities/normalized-message.entity';
import { NormalizedListing, ServiceFees, Policy } from '../entities/normalized-listing.entity';
import { TemplateDetectorService } from './template-detector.service';

const templateDetector = new TemplateDetectorService();

/**
 * Normalization Service
 * Pure Domain Service responsible for parsing data_raw strings into structured entities.
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
   * Normalizes a raw JSON message into a legacy NormalizedMessage entity
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
      hasElevator: this.parseHasElevator(rawText) === true,
      furniture: this.parseFurniture(rawText),
      services: this.parseServices(rawText),
      notes: this.parseNotes(rawText),
    };
  }

  /**
   * Normalizes a raw JSON message into the new NormalizedListing entity
   */
  public normalizeListing(input: RawJsonInputMessage): NormalizedListing {
    const rawText = input.data_raw || '';
    const contentHash = this.generateContentHash(rawText);
    const templateFamily = templateDetector.detect(rawText);

    const code = this.parseCode(rawText);
    const address = this.parseAddress(rawText);
    const district = this.parseDistrict(rawText);
    const priceRaw = this.parsePriceRaw(rawText);
    const priceNumeric = this.parsePriceNumeric(rawText);
    const priceRange = this.parsePriceRange(rawText);

    const isPartiallyParsed = templateFamily === null || (!code && !address && !priceRaw);

    return {
      id: input.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contentHash,
      data_raw: rawText,
      createdAt: new Date().toISOString(),
      templateFamily,
      isPartiallyParsed,
      code,
      address,
      district,
      priceRaw,
      priceNumeric,
      priceRange,
      roomType: this.parseRoomType(rawText),
      availableRooms: this.parseAvailableRooms(rawText),
      floor: this.parseFloor(rawText),
      hasElevator: this.parseHasElevator(rawText),
      commission: this.parseCommission(rawText),
      commissionCode: this.parseCommissionCode(rawText),
      axis: this.parseAxis(rawText),
      area: this.parseArea(rawText),
      furniture: this.parseFurniture(rawText),
      services: this.parseServices(rawText),
      serviceFees: this.parseDetailedServices(rawText),
      policies: this.parsePolicies(rawText),
      notes: this.parseNotes(rawText),
      availabilityDate: this.parseAvailabilityDate(rawText),
      maxOccupants: null,
      paymentTerms: null,
      contactRequirement: null,
    };
  }

  private parseCode(text: string): string | null {
    const match = text.match(/(?:Mã|MA|code)\s*[: ]\s*([A-Za-z0-9_-]+)/i);
    return match ? match[1].trim() : null;
  }

  private parseAddress(text: string): string | null {
    const match = text.match(/(?:🏠|🏡)?\s*(?:Địa chỉ|ĐC)\s*:\s*(.+)/i);
    if (match) return match[1].trim();

    const lineMatch = text.match(/(?:Số|Ngõ|Phường|Đường|Phố)\s+[^\n]+/i);
    return lineMatch ? lineMatch[0].trim() : null;
  }

  private parseDistrict(text: string): string | null {
    const normText = text.normalize('NFC').toLowerCase();
    const districts = [
      'Thanh Xuân', 'Đống Đa', 'Cầu Giấy', 'Ba Đình', 'Hai Bà Trưng',
      'Hoàn Kiếm', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Nam Từ Liêm',
      'Bắc Từ Liêm', 'Hà Đông', 'Gia Lâm', 'Đông Anh', 'Thanh Trì'
    ];
    for (const d of districts) {
      if (normText.includes(d.normalize('NFC').toLowerCase())) {
        return d;
      }
    }
    return null;
  }

  private parseAvailableRooms(text: string): string | null {
    const match = text.match(/(?:⏰|⌛)?\s*(?:Trống|Còn)\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parsePriceRaw(text: string): string | null {
    const match = text.match(/(?:💰|💸|💵)?\s*Giá\s*:\s*(.+)/i);
    if (match) return match[1].trim();

    const rangeMatch = text.match(/(\d+(?:\.\d+)?\s*tr\s*\d*\s*-\s*\d+(?:\.\d+)?\s*tr\s*\d*)/i);
    if (rangeMatch) return rangeMatch[1].trim();

    const singlePriceMatch = text.match(/(\d+(?:\.\d+)?\s*tr\s*\d*k?)/i);
    if (singlePriceMatch) return singlePriceMatch[1].trim();

    return null;
  }

  public parsePriceNumeric(text: string): number | null {
    const priceRaw = this.parsePriceRaw(text) || text;

    const trRangeMatch = priceRaw.match(/(\d+(?:\.\d+)?)\s*tr\s*(\d*)/i);
    if (trRangeMatch) {
      const millions = parseFloat(trRangeMatch[1]);
      let remainderStr = trRangeMatch[2];
      let remainder = 0;
      if (remainderStr) {
        if (remainderStr.length === 1) remainderStr = remainderStr + '00';
        else if (remainderStr.length === 2) remainderStr = remainderStr + '0';
        remainder = parseInt(remainderStr, 10);
      }
      return Math.round(millions * 1_000_000 + remainder * 1_000);
    }

    const trMatch = priceRaw.match(/(\d+(?:\.\d+)?)\s*tr/i);
    if (trMatch) {
      return Math.round(parseFloat(trMatch[1]) * 1_000_000);
    }

    const digitMatch = priceRaw.replace(/\./g, '').match(/\d{6,8}/);
    if (digitMatch) {
      return parseInt(digitMatch[0], 10);
    }

    return null;
  }

  private parsePriceRange(text: string): { from: number; to: number } | null {
    const priceRaw = this.parsePriceRaw(text);
    if (!priceRaw || !priceRaw.includes('-')) return null;

    const parts = priceRaw.split('-').map((s) => s.trim());
    if (parts.length < 2) return null;

    const from = this.parsePriceNumeric(parts[0]);
    const to = this.parsePriceNumeric(parts[1]);

    if (from && to) return { from, to };
    return null;
  }

  private parseCommission(text: string): number | null {
    const match = text.match(/(?:hh|hoa hồng|rose|🌹)\s*[: ]?\s*(\d+)\s*%/i);
    return match ? parseInt(match[1], 10) : null;
  }

  private parseCommissionCode(text: string): string | null {
    const match = text.match(/(?:hh|hoa hồng|Mã)\s*[: ]?\s*([A-Za-z0-9_-]+)/i);
    return match ? match[1].trim() : null;
  }

  private parseAxis(text: string): string | null {
    const match = text.match(/Trục\s+([^\n,;\(\)]+)/i);
    if (match) {
      const raw = match[1].trim().toLowerCase();
      if (raw.includes('ngoài')) return 'Trục ngoài';
      if (raw.includes('trong')) return 'Trục trong';
      return `Trục ${raw}`;
    }
    return null;
  }

  private parseArea(text: string): number | null {
    const match = text.match(/(\d+)\s*(?:m2|m²)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  private parseFloor(text: string): number | null {
    const match = text.match(/Tầng\s*(\d+)|T(\d+)\b/i);
    if (match) {
      return parseInt(match[1] || match[2], 10);
    }
    return null;
  }

  private parseRoomType(text: string): string | null {
    const match = text.match(/(?:👉)?\s*Phòng\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parseHasElevator(text: string): boolean | null {
    if (/thang\s*máy/i.test(text)) return true;
    if (/thang\s*bộ/i.test(text)) return false;
    return null;
  }

  private parseFurniture(text: string): string | null {
    const match = text.match(/(?:✅|💥)?\s*Nội thất\s*:\s*(.+)/i);
    return match ? match[1].trim() : null;
  }

  private parseServices(text: string): ServicePricing {
    const match = text.match(/(?:✅|☘️)?\s*(?:Dịch vụ|Phí dv)\s*:\s*(.+)/i);
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

  private parseDetailedServices(text: string): ServiceFees {
    const parseNum = (str: string): number | null => {
      const m = str.match(/(\d+(?:\.\d+)?)\s*(k|k\/|đ|tr)?/i);
      if (!m) return null;
      const val = parseFloat(m[1]);
      if (m[2]?.toLowerCase().startsWith('k')) return val * 1000;
      if (m[2]?.toLowerCase() === 'tr') return val * 1000000;
      return val;
    };

    let electricity: number | null = null;
    let water: number | null = null;
    let internet: number | null = null;
    let management: number | null = null;
    let washingMachine: number | null = null;
    let parking: number | null = null;

    const lines = text.split(/[\n,;-]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/Điện/i.test(trimmed) && electricity === null) {
        electricity = parseNum(trimmed);
      } else if (/Nước/i.test(trimmed) && water === null) {
        water = parseNum(trimmed);
      } else if (/(?:Mạng|Internet|wifi)/i.test(trimmed) && internet === null) {
        internet = parseNum(trimmed);
      } else if (/(?:Dịch vụ chung|Dv chung|\bdvc\b|Dịch vụ\s*\d+|Phí quản lý|Vệ sinh)/i.test(trimmed) && management === null) {
        management = parseNum(trimmed);
      } else if (/(?:Giặt|Máy giặt)/i.test(trimmed) && washingMachine === null) {
        washingMachine = parseNum(trimmed);
      } else if (/(?:Xe|Gửi xe)/i.test(trimmed) && parking === null) {
        parking = parseNum(trimmed);
      }
    }

    const feeSectionMatch = text.match(/(?:✅|☘️|⚡)?\s*(?:Dịch vụ|Phí dv|Chi phí)\s*[:\n]\s*([\s\S]+?)(?:\n\n|\n[A-Z0-9✅❌📍🛋💥⛳️]|$)/i);

    return {
      electricity,
      water,
      internet,
      management,
      washingMachine,
      parking,
      cleaning: null,
      other: [],
      raw: feeSectionMatch ? feeSectionMatch[0].trim() : '',
    };
  }

  private parsePolicies(text: string): Policy[] {
    const policies: Policy[] = [];
    if (/nuôi\s*chó|nuôi\s*mèo|pet/i.test(text)) {
      policies.push({ type: 'PET', description: 'Cho phép nuôi thú cưng / Pet' });
    }
    if (/khách\s*nước\s*ngoài/i.test(text)) {
      policies.push({ type: 'FOREIGNER', description: 'Nhận khách nước ngoài' });
    }
    if (/ô\s*tô|gửi\s*xe/i.test(text)) {
      policies.push({ type: 'VEHICLE', description: 'Có bãi gửi xe / ô tô' });
    }
    return policies;
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

  private parseAvailabilityDate(text: string): string | null {
    const match = text.match(/vào\s*ở\s*(?:ngày\s*)?(\d{1,2}\/\d{1,2})/i);
    if (match) return match[1];
    if (/ở\s*ngay/i.test(text)) return 'Ở ngay';
    return null;
  }
}
