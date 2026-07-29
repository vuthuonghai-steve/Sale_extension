import { ServicePricing } from './normalized-message.entity';

export interface ServiceFees {
  electricity: number | null;        // VND per kWh
  water: number | null;              // VND per unit/person
  internet: number | null;           // VND per month
  management: number | null;         // VND per person/month
  washingMachine: number | null;     // VND per person/month
  parking: number | null;            // VND per month
  cleaning: number | null;           // VND per month
  other: { name: string; amount: number }[];
  raw: string;                       // Preserved original text
}

export interface Policy {
  type: 'PET' | 'VEHICLE' | 'FOREIGNER' | 'OCCUPANTS' | 'PAYMENT' | 'CONTACT' | 'OTHER';
  description: string;
}

export type TemplateFamily = 'TNR' | 'Sky' | '95_Home' | null;

export interface NormalizedListing {
  // === Core fields (luôn có) ===
  id: string;                        // ID gốc từ source
  contentHash: string;               // Deterministic hash (case/space normalized)
  data_raw: string;                  // Preserved intact — 100% gốc
  createdAt: string;                 // ISO 8601 — thời điểm import

  // === Classification ===
  templateFamily: TemplateFamily;    // null = free_text / unknown
  isPartiallyParsed: boolean;        // true = không parse được đầy đủ, đánh dấu để review

  // === Property fields ===
  code: string | null;               // Mã: A82, A1204
  address: string | null;            // Địa chỉ thô (raw)
  district: string | null;           // Quận (extracted từ address)
  priceRaw: string | null;           // Giá thô: "4tr7", "4tr - 4tr2"
  priceNumeric: number | null;       // Giá số: 4700000 (lower bound nếu range)
  priceRange: { from: number; to: number } | null;  // Range: 4000000 - 4200000
  roomType: string | null;           // Studio, 1N1K, Gác xép
  availableRooms: string | null;     // P802, tầng 2, 8p
  floor: number | null;              // Tầng
  hasElevator: boolean | null;       // Thang máy (true) / Thang bộ (false)

  // === Commission & Axis ===
  commission: number | null;         // Phần trăm hoa hồng: 30, 40
  commissionCode: string | null;     // Mã hoa hồng: "1599", "H315"
  axis: string | null;               // Trục tòa nhà: "Trục ngoài"

  // === Details ===
  area: number | null;               // Diện tích m²
  furniture: string | null;          // Nội thất description thô
  services: ServicePricing;          // Legacy service pricing format
  serviceFees: ServiceFees;          // Chi phí dịch vụ chi tiết
  policies: Policy[];                // Quy định
  notes: string[];                   // Lưu ý bổ sung
  availabilityDate: string | null;   // Ngày trống: "01/08"
  maxOccupants: number | null;       // Số người tối đa

  // === Payment ===
  paymentTerms: string | null;       // "1 cọc 1", "HĐ 12 tháng"
  contactRequirement: string | null; // "Gọi trước 30p"
}
