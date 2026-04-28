import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxWithdrawAmountValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as number | null;
    if (value == null) return null;
    return value > max ? { maxAmount: { max, actual: value } } : null;
  };
}
