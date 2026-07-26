import { Result, ok, err } from '../../shared/kernel/result';
import type { AppError } from '../../shared/contracts/errors';

export interface ContactData {
  phone: string;
  name: string;
  email?: string;
}

export function validateContact(data: Partial<ContactData>): Result<ContactData, AppError> {
  if (!data.name || data.name.trim().length === 0) {
    return err({
      code: 'VALIDATION',
      message: 'Contact name is required',
    });
  }

  if (!data.phone || !/^[0-9+]{9,15}$/.test(data.phone)) {
    return err({
      code: 'VALIDATION',
      message: 'Invalid contact phone number',
    });
  }

  return ok({
    name: data.name.trim(),
    phone: data.phone,
    email: data.email,
  });
}
