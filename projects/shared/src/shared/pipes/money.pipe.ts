import { Pipe, PipeTransform } from '@angular/core';
import type { Money } from '../../core/models';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  /**
   * Format Money as "{amount} {currency}". Returns empty string for nullish value.
   * When `signed` is true a leading "+" is added for positive amounts (negatives already carry "-").
   */
  transform(value: Money | null | undefined, signed = false): string {
    if (!value) return '';
    const amount = parseFloat(value.amount.toFixed(2));
    const sign = signed && amount > 0 ? '+' : '';
    return `${sign}${amount} ${value.currency}`;
  }
}
