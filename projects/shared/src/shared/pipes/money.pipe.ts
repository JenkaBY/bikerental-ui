import { Pipe, PipeTransform } from '@angular/core';
import type { Money } from '../../core/models';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  /**
   * Format Money as "{amount} {currency}". Returns empty string for nullish value.
   */
  transform(value: Money | null | undefined): string {
    if (!value) return '';
    return `${parseFloat(value.amount.toString())} ${value.currency}`;
  }
}
