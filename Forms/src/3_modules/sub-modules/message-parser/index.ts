import type { LeadEntity } from '@contracts';
import { TextSanitizer } from '../text-sanitizer/index.ts';

export class MessageParser {
  private static removeAccents(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  private static cleanLineContent(content: string): string {
    return TextSanitizer.removeHiddenChars(content).trim();
  }

  private static normalizeLabel(label: string): string {
    const unaccented = this.removeAccents(TextSanitizer.removeHiddenChars(label));
    return unaccented
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  public static parse(rawText: string): LeadEntity {
    if (!rawText || !rawText.trim()) {
      return {};
    }

    const cleanedText = TextSanitizer.removeHiddenChars(rawText);
    const rawLines = cleanedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: { [key: string]: string | undefined } = {};
    const unparsedNotes: string[] = [];

    // 1. Kiểm tra dòng đầu tiên xem có phải tên Team/Group không
    if (rawLines.length > 0 && rawLines[0] !== undefined) {
      const firstLine = rawLines[0];
      const normFirst = this.normalizeLabel(firstLine);
      if (
        normFirst.includes('team') ||
        normFirst.includes('group') ||
        normFirst.includes('home') ||
        normFirst.includes('house')
      ) {
        result.teamName = firstLine;
      }
    }

    for (const rawLine of rawLines) {
      // Bỏ qua dòng teamName đầu tiên nếu đã match
      if (rawLine === result.teamName) {
        continue;
      }

      // Tách Key - Value qua dấu hai chấm ':' hoặc '：'
      const colonIndex = rawLine.search(/[:：]/);
      if (colonIndex !== -1) {
        const rawKey = rawLine.substring(0, colonIndex);
        const rawVal = rawLine.substring(colonIndex + 1);

        const cleanVal = this.cleanLineContent(rawVal);
        const normKey = this.normalizeLabel(rawKey);

        if (this.isCustomerSocialLabel(normKey)) {
          result.customerName = cleanVal;
          continue;
        }

        if (this.isPhoneLabel(normKey)) {
          result.customerPhone = this.extractPhoneNumber(cleanVal) || cleanVal;
          continue;
        }

        if (this.isAddressLabel(normKey)) {
          result.address = cleanVal;
          continue;
        }

        if (this.isViewTimeLabel(normKey)) {
          result.viewTime = cleanVal;
          continue;
        }

        if (this.isPriceLabel(normKey)) {
          result.price = cleanVal;
          continue;
        }

        if (this.isRoomCodeLabel(normKey)) {
          result.roomCode = cleanVal;
          continue;
        }

        if (this.isSalesLabel(normKey)) {
          result.salesName = cleanVal;
          continue;
        }
      }

      // Heuristic fallback cho dòng không có dấu ':' hoặc nhãn đặc thù
      const normLine = this.normalizeLabel(rawLine);

      // Check SĐT trong dòng nếu chưa có phone
      if (!result.customerPhone) {
        const phone = this.extractPhoneNumber(rawLine);
        if (phone && (normLine.includes('sdt') || normLine.includes('phone') || normLine.startsWith(phone))) {
          result.customerPhone = phone;
          continue;
        }
      }

      // Check mã phòng (ví dụ "Mã : AHS284" hoặc "Mã AHS284")
      const roomMatch = rawLine.match(/(?:mã\s*phòng|mã|ma\s*phong|ma)\s*[:：]?\s*([a-zA-Z0-9\-_]+)/i);
      if (!result.roomCode && roomMatch?.[1]) {
        result.roomCode = roomMatch[1].trim();
        continue;
      }

      // Check Sales name (ví dụ "Tên Sales : Tuấn")
      const salesMatch = rawLine.match(/(?:tên\s*sales|tên\s*ctv|ctv|sales|sale)\s*[:：]?\s*(.+)/i);
      if (!result.salesName && salesMatch?.[1]) {
        result.salesName = salesMatch[1].trim();
        continue;
      }

      unparsedNotes.push(rawLine);
    }

    // Nếu customerName chưa có nhưng dòng đó chứa SĐT
    if (!result.customerPhone && result.customerName) {
      const phoneInName = this.extractPhoneNumber(result.customerName);
      if (phoneInName) {
        result.customerPhone = phoneInName;
      }
    }

    return {
      teamName: result.teamName,
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      address: result.address,
      viewTime: result.viewTime,
      price: result.price,
      roomCode: result.roomCode,
      salesName: result.salesName,
      rawNotes: unparsedNotes.length > 0 ? unparsedNotes.join('\n') : undefined,
    };
  }

  public static extractPhoneNumber(text: string): string | undefined {
    const match = text.match(/(?:(?:\+84|84|0)[3|5|7|8|9][0-9]{8})\b/);
    return match ? match[0] : undefined;
  }

  private static isCustomerSocialLabel(key: string): boolean {
    return (
      key.includes('fbzalo') ||
      key.includes('fb') ||
      key.includes('zalo') ||
      key.includes('tenkh') ||
      key.includes('khachhang') ||
      key === 'khach' ||
      key.includes('tenkhfbzalo')
    );
  }

  private static isPhoneLabel(key: string): boolean {
    return (
      key.includes('sdt') ||
      key.includes('phone') ||
      key.includes('tel') ||
      key.includes('didong') ||
      key.includes('sdtkhach')
    );
  }

  private static isAddressLabel(key: string): boolean {
    return (
      key.includes('diachi') ||
      key.includes('dc') ||
      key.includes('vitri') ||
      key.includes('diachiphong')
    );
  }

  private static isViewTimeLabel(key: string): boolean {
    return (
      key.includes('ngaygio') ||
      key.includes('thoigian') ||
      key.includes('ngayxem') ||
      key.includes('gioxem') ||
      key.includes('xemphong') ||
      key.includes('henxem') ||
      key.includes('thoigianxem') ||
      key.includes('ngaygioxem')
    );
  }

  private static isPriceLabel(key: string): boolean {
    return (
      key.includes('giatuvan') ||
      key.includes('giaphong') ||
      key === 'gia' ||
      key.includes('mucthuong') ||
      key.includes('gia')
    );
  }

  private static isRoomCodeLabel(key: string): boolean {
    return (
      key.includes('maphong') ||
      key.includes('matoa') ||
      key.includes('toanha') ||
      key.includes('toa') ||
      key === 'ma' ||
      key === 'map' ||
      key.includes('sophong') ||
      key.includes('macan')
    );
  }


  private static isSalesLabel(key: string): boolean {
    return (
      key.includes('tensales') ||
      key.includes('tenctv') ||
      key.includes('ctv') ||
      key.includes('sales') ||
      key.includes('sale') ||
      key.includes('nguoituvan')
    );
  }
}
