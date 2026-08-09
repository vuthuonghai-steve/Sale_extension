export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'time'
  | 'email'
  | 'phone'
  | 'number';

export interface FormFieldDescriptor {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: FormFieldType;
  readonly required: boolean;
  readonly options?: readonly string[];
  readonly currentValue?: string | boolean | readonly string[];
  readonly selector?: string;
}

export interface ExtractedFormData {
  readonly url: string;
  readonly title: string;
  readonly fields: readonly FormFieldDescriptor[];
  readonly extractedAt: number;
}

export interface FormFillInstruction {
  readonly fieldId: string;
  readonly value: string | boolean | readonly string[];
}

export interface FormFillResult {
  readonly success: boolean;
  readonly filledFieldsCount: number;
  readonly failedFields: readonly string[];
  readonly message?: string;
}
