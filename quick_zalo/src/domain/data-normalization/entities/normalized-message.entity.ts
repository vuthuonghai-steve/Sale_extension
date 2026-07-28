/**
 * Normalized Message Entity
 * Represents structured real estate / message data normalized from raw text.
 */

export interface ServicePricing {
  electricity?: string;
  water?: string;
  management?: string;
  washingMachine?: string;
  internet?: string;
  other?: string;
}

export interface NormalizedMessage {
  /** Unique ID of the record (from input JSON or generated) */
  id: string;

  /** Content hash of data_raw for 2-stage deduplication */
  contentHash: string;

  /** PRESERVED INTACT original raw message text */
  data_raw: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  // --- Normalized Fields ---

  /** Real estate code (e.g. "A82") */
  code: string | null;

  /** Property address (e.g. "Ngõ 46 Nhân Hoà - Thanh Xuân") */
  address: string | null;

  /** Extracted District (e.g. "Thanh Xuân", "Đống Đa") */
  district: string | null;

  /** Room availability status (e.g. "P802", "P201") */
  availableRooms: string | null;

  /** Raw price text (e.g. "4tr7", "4tr3 - 4tr6") */
  priceRaw: string | null;

  /** Numeric parsed price in VND (e.g. 4700000) */
  priceNumeric: number | null;

  /** Room type (e.g. "Studio", "Gác Xép", "1N1B") */
  roomType: string | null;

  /** Whether the property has an elevator */
  hasElevator: boolean;

  /** Furniture details (e.g. "Full nội thất cơ bản") */
  furniture: string | null;

  /** Service fees breakdown */
  services: ServicePricing;

  /** Special rules / notes */
  notes: string[];
}

export interface RawJsonInputMessage {
  id: string;
  data_raw: string;
}

export interface RawJsonInputFile {
  messages: RawJsonInputMessage[];
}

export interface IngestionMetrics {
  totalInput: number;
  dupesInFile: number;
  dupesInDb: number;
  newlyInserted: number;
}
