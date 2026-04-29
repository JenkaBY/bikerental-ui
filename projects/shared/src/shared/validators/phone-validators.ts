import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export const PhoneValidators = [Validators.required, Validators.pattern(PHONE_PATTERN)];

export function phonePatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') return null;
    const s = String(value).trim();

    const allowedPattern = /^\+?[0-9\s\-().]+$/;
    if (!allowedPattern.test(s)) return { phonePattern: { value: control.value } };

    // Reject multiple plus signs
    const plusCount = (s.match(/\+/g) || []).length;
    if (plusCount > 1) return { phonePattern: { value: control.value } };

    const digits = s.replace(/\D/g, '');
    const len = digits.length;
    if (len < 7 || len > 15) return { phonePattern: { value: control.value } };

    return null;
  };
}
