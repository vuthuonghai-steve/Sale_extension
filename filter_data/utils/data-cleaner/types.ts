/**
 * Data Cleaning & Transformation Module - Type Definitions
 * Khung định nghĩa kiểu dữ liệu cho module chuyển đổi dữ liệu thô (Raw) thành dữ liệu sạch (Clean)
 */

export interface RawRecord extends Record<string, unknown> {
  rawText?: string;
  sourceLineStart?: number;
  sourceLineEnd?: number;
  [key: string]: unknown;
}

export interface UtilityFees {
  electricityPerKwh?: number;
  waterPerM3?: number;
  waterPerPerson?: number;
  internetPerRoom?: number;
  internetPerPerson?: number;
  generalServicePerPerson?: number;
  generalServicePerRoom?: number;
  rawText?: string;
}

export interface PolicyRules {
  allowPet?: boolean;
  allowElectricVehicle?: boolean;
  allowForeigner?: boolean;
  maxOccupants?: number;
  maxVehicles?: number;
  rawNotes?: string[];
}

export interface CleanListingRecord extends Record<string, unknown> {
  id: string;
  managerCode?: string;
  commission?: string;
  address?: string;
  district?: string;
  roomType?: string;
  priceVnd?: number;
  priceMaxVnd?: number;
  areaSqm?: number;
  availableDate?: string;
  utilityFees?: UtilityFees;
  policies?: PolicyRules;
  amenities?: string[];
  fingerprintHash?: string;
  isFull?: boolean;
  rawRef?: string;
}

export interface CleanRecord extends Record<string, unknown> {
  [key: string]: unknown;
}

export interface CleaningOptions {
  strictMode?: boolean;
  dropInvalidRecords?: boolean;
  trimStrings?: boolean;
  removeNulls?: boolean;
  customConfig?: Record<string, unknown>;
}

export interface StepLog {
  stepName: string;
  processedCount: number;
  filteredCount: number;
  executionTimeMs: number;
  notes?: string[];
}

export interface CleaningReport {
  timestamp: string;
  totalInputRecords: number;
  totalOutputRecords: number;
  droppedRecordsCount: number;
  totalExecutionTimeMs: number;
  stepLogs: StepLog[];
  errors: Array<{ stepName: string; error: string; recordIndex?: number }>;
}

export interface ICleaningStep<TIn = any, TOut = any> {
  readonly name: string;
  readonly enabled: boolean;
  execute(input: TIn, options?: CleaningOptions): TOut | Promise<TOut>;
}
