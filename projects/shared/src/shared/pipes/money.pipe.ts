import { inject, Pipe, PipeTransform } from '@angular/core';
import { BusinessCurrencyStore } from '../../core/state/business-currency.store';
import type { Money } from '../../core/models';

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly currency = inject(BusinessCurrencyStore);

  transform(value: Money | null | undefined, signed = false): string {
    if (!value) return '';
    const amount = parseFloat(value.amount.toFixed(2));
    const sign = signed && amount > 0 ? '+' : '';
    return `${sign}${amount} ${this.currency.symbol()}`.trimEnd();
  }
}
