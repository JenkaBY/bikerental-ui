import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { maxDecimalPlacesValidator } from './number-validators';

const MONEY_DECIMALS = 2;
const MIN_MONEY_AMOUNT = 0.01;

export function maxAmountValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as number | null;
    if (value == null) return null;
    return value > max ? { maxAmount: { max, actual: value } } : null;
  };
}

export function moneyAmountValidators(max: number): ValidatorFn[] {
  return [
    Validators.required,
    Validators.min(MIN_MONEY_AMOUNT),
    maxDecimalPlacesValidator(MONEY_DECIMALS),
    maxAmountValidator(max),
  ];
}

export function countedAmountValidators(): ValidatorFn[] {
  return [Validators.required, Validators.min(0), maxDecimalPlacesValidator(MONEY_DECIMALS)];
}

export function notFutureDateValidator(today: Date): ValidatorFn {
  const limit = startOfDay(today);
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
    return startOfDay(value) > limit ? { futureDate: true } : null;
  };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
