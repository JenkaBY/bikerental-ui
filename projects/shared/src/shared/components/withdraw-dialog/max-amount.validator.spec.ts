import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { maxWithdrawAmountValidator } from './max-amount.validator';

describe('maxWithdrawAmountValidator', () => {
  it('returns null when control value is null or undefined', () => {
    const validator = maxWithdrawAmountValidator(100);
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(undefined))).toBeNull();
  });

  it('returns null when value is less than or equal to max', () => {
    const validator = maxWithdrawAmountValidator(100);
    expect(validator(new FormControl(0))).toBeNull();
    expect(validator(new FormControl(50))).toBeNull();
    expect(validator(new FormControl(100))).toBeNull();
  });

  it('returns an error object when value is greater than max', () => {
    const validator = maxWithdrawAmountValidator(100);
    const result = validator(new FormControl(150));
    expect(result).toEqual({ maxAmount: { max: 100, actual: 150 } });
  });

  it('works with numeric strings (JS comparison semantics)', () => {
    const validator = maxWithdrawAmountValidator(100);
    // '150' > 100 is true in JS so validator should return an error with actual === '150'
    const result = validator(new FormControl('150' as unknown as number));
    expect(result).toEqual({ maxAmount: { max: 100, actual: '150' } });
    // '50' <= 100 -> no error
    expect(validator(new FormControl('50' as unknown as number))).toBeNull();
  });
});
