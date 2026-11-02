import { ValidatorFn } from '@angular/forms';
import { maxAmountValidator } from '../../validators/amount-validators';

export function maxWithdrawAmountValidator(max: number): ValidatorFn {
  return maxAmountValidator(max);
}
