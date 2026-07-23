import { BaseCleaningStep } from './base-step';
import type { CleanListingRecord, CleaningOptions, UtilityFees, PolicyRules } from '../types';

/**
 * NormalizerStep
 * Chuẩn hóa kiểu dữ liệu, ánh xạ Quận/Huyện Hà Nội, phân tích Phí dịch vụ & Quy định chính sách.
 */
export class NormalizerStep extends BaseCleaningStep<CleanListingRecord[], CleanListingRecord[]> {
  public readonly name = 'NormalizerStep';

  // Từ điển 12 Quận/Huyện tại Hà Nội
  private static readonly DISTRICTS = [
    'Cầu Giấy',
    'Nam Từ Liêm',
    'Bắc Từ Liêm',
    'Thanh Xuân',
    'Hà Đông',
    'Tây Hồ',
    'Đống Đa',
    'Ba Đình',
    'Hai Bà Trưng',
    'Hoài Đức',
    'Hoàn Kiếm',
    'Long Biên',
  ];

  // Từ điển ánh xạ từ Tên đường / Địa danh ➔ Quận
  private static readonly LANDMARK_MAP: Record<string, string> = {
    'đình thôn': 'Nam Từ Liêm',
    'mễ trì': 'Nam Từ Liêm',
    'phú đô': 'Nam Từ Liêm',
    'lê quang đạo': 'Nam Từ Liêm',
    'đỗ đức dục': 'Nam Từ Liêm',
    'nguyễn khang': 'Cầu Giấy',
    'trung liệt': 'Đống Đa',
    'xã đàn': 'Đống Đa',
    'nam đồng': 'Đống Đa',
    'thái hà': 'Đống Đa',
    'chùa bộc': 'Đống Đa',
    'khương đình': 'Thanh Xuân',
    'lê trọng tấn': 'Thanh Xuân',
    'vũ tông phan': 'Thanh Xuân',
    'bùi xương trạch': 'Thanh Xuân',
    'nhân hoà': 'Thanh Xuân',
    'trần phú': 'Hà Đông',
    'đô nghĩa': 'Hà Đông',
    'yên nghĩa': 'Hà Đông',
    'nhật chiêu': 'Tây Hồ',
    'tứ liên': 'Tây Hồ',
    'lạc long quân': 'Tây Hồ',
    'xuân la': 'Tây Hồ',
    'đội cấn': 'Ba Đình',
    'hoàng hoa thám': 'Ba Đình',
    'kim ngưu': 'Hai Bà Trưng',
    'nguyễn an ninh': 'Hai Bà Trưng',
    'trần đại nghĩa': 'Hai Bà Trưng',
    'bách khoa': 'Hai Bà Trưng',
    'kinh tế quốc dân': 'Hai Bà Trưng',
    'bạch mai': 'Hai Bà Trưng',
    'minh khai': 'Hai Bà Trưng',
    'lĩnh nam': 'Hai Bà Trưng',
    'nguyễn chính': 'Hai Bà Trưng',
    'hinode': 'Hoài Đức',
    'phú diễn': 'Bắc Từ Liêm',
  };

  public execute(input: CleanListingRecord[], _options?: CleaningOptions): CleanListingRecord[] {
    if (!this.enabled) return input;

    return input.map((record) => {
      const rawText = record.rawRef || '';
      
      // 1. Chuẩn hóa Quận/Huyện
      const district = this.normalizeDistrict(record.address || '', rawText);

      // 2. Parse Phí dịch vụ
      const utilityFees = this.parseUtilityFees(rawText);

      // 3. Parse Quy định chính sách
      const policies = this.parsePolicies(rawText);

      return {
        ...record,
        district,
        utilityFees,
        policies,
      };
    });
  }

  private normalizeDistrict(address: string, rawText: string): string {
    const combined = `${address} ${rawText}`.toLowerCase();

    // 1. Tìm trực tiếp tên Quận trong text
    for (const d of NormalizerStep.DISTRICTS) {
      if (combined.includes(d.toLowerCase())) {
        return d;
      }
    }

    // 2. Suy luận từ từ điển Địa danh / Tên đường
    for (const [landmark, dist] of Object.entries(NormalizerStep.LANDMARK_MAP)) {
      if (combined.includes(landmark)) {
        return dist;
      }
    }

    return '';
  }

  private parseUtilityFees(rawText: string): UtilityFees {
    const fees: UtilityFees = {};

    // Điện: 4.000đ/số | 4k/số | 3.800đ/số
    const eleMatch = rawText.match(/Điện\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:k|đ|000)?\s*\/\s*số/i);
    if (eleMatch) {
      fees.electricityPerKwh = this.parseFeeValue(eleMatch[1]);
    }

    // Nước: 35.000đ/m³ | 35k/khối | 100k/người | 120k/ng
    const waterMatch = rawText.match(
      /Nước\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:k|đ|000)?\s*\/\s*(m³|m3|khối|người|ng)/i
    );
    if (waterMatch) {
      const val = this.parseFeeValue(waterMatch[1]);
      const unit = waterMatch[2].toLowerCase();
      if (unit.includes('ng')) {
        fees.waterPerPerson = val;
      } else {
        fees.waterPerM3 = val;
      }
    }

    // Internet / Wifi: 100.000đ/phòng | 70k/người
    const netMatch = rawText.match(
      /(?:Wifi|Internet|Mạng)\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:k|đ|000)?\s*\/\s*(phòng|p|người|ng)/i
    );
    if (netMatch) {
      const val = this.parseFeeValue(netMatch[1]);
      const unit = netMatch[2].toLowerCase();
      if (unit.includes('ng')) {
        fees.internetPerPerson = val;
      } else {
        fees.internetPerRoom = val;
      }
    }

    // Dịch vụ chung: 150.000đ/người | 200k/người
    const dvcMatch = rawText.match(
      /(?:Dịch\s*vụ|Dvc|Dịch\s*vụ\s*chung)\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:k|đ|000)?\s*\/\s*(người|ng|phòng|p)/i
    );
    if (dvcMatch) {
      const val = this.parseFeeValue(dvcMatch[1]);
      const unit = dvcMatch[2].toLowerCase();
      if (unit.includes('ng')) {
        fees.generalServicePerPerson = val;
      } else {
        fees.generalServicePerRoom = val;
      }
    }

    return fees;
  }

  private parseFeeValue(valStr: string): number {
    if (!valStr) return 0;
    let clean = valStr.trim().toLowerCase();

    const hasK = clean.includes('k');
    clean = clean.replace(/k/g, '');

    // Nếu dạng "100.000" hoặc "35.000" (dấu chấm phân cách hàng nghìn)
    if (/^\d{1,3}(?:\.\d{3})+$/.test(clean)) {
      clean = clean.replace(/\./g, '');
    } else {
      clean = clean.replace(',', '.');
    }

    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return 0;

    if (hasK || num < 500) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }

  private parsePolicies(rawText: string): PolicyRules {
    const policies: PolicyRules = {};

    // Pet
    if (/không\s*nuôi\s*pet|không\s*nuôi\s*chó|k\s*pet|không\s*nuôi\s*động\s*vật/i.test(rawText)) {
      policies.allowPet = false;
    } else if (
      /cho\s*nuôi\s*pet|được\s*nuôi\s*pet|nhận\s*pet|nuôi\s*pet\s*ok|có\s*nuôi\s*mèo/i.test(rawText)
    ) {
      policies.allowPet = true;
    }

    // Xe điện
    if (/không\s*nhận\s*xe\s*điện|k\s*xe\s*điện|không\s*xe\s*điện|ko\s*xe\s*điện/i.test(rawText)) {
      policies.allowElectricVehicle = false;
    } else if (/nhận\s*xe\s*điện|xe\s*điện\s*:\s*có/i.test(rawText)) {
      policies.allowElectricVehicle = true;
    }

    // Khách nước ngoài
    if (/không\s*nhận\s*khách\s*nước\s*ngoài|không\s*nước\s*ngoài|k\s*nước\s*ngoài/i.test(rawText)) {
      policies.allowForeigner = false;
    } else if (/nhận\s*khách\s*nước\s*ngoài|có\s*nhận\s*nước\s*ngoài/i.test(rawText)) {
      policies.allowForeigner = true;
    }

    // Giới hạn xe & người
    const occMatch = rawText.match(/tối\s*đa\s*(\d+)\s*người/i);
    if (occMatch) {
      policies.maxOccupants = parseInt(occMatch[1], 10);
    }

    const vehMatch = rawText.match(/(?:tối\s*đa|giới\s*hạn)\s*(\d+)\s*xe/i);
    if (vehMatch) {
      policies.maxVehicles = parseInt(vehMatch[1], 10);
    }

    return policies;
  }
}
