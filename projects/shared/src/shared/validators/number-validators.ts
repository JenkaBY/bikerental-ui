import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxDecimalPlacesValidator(decimals: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') return null;
    const pattern = new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`);
    return pattern.test(String(value)) ? null : { maxDecimalPlaces: { decimals, actual: value } };
  };
}
