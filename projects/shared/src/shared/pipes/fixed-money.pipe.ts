import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import type { Money } from '../../core/models';
import { BusinessCurrencyStore } from '../../core/state/business-currency.store';

export const FIXED_MONEY_EMPTY = '—';
const MINUS_SIGN = '−';

export function formatFixedMoney(
  value: Money | null | undefined,
  locale: string,
  symbol: string,
  signed = false,
): string {
  if (!value) return FIXED_MONEY_EMPTY;
  const digits = formatNumber(Math.abs(value.amount), locale, '1.2-2');
  const sign = value.amount < 0 ? MINUS_SIGN : signed && value.amount > 0 ? '+' : '';
  return `${sign}${digits} ${symbol}`.trimEnd();
}

@Pipe({ name: 'fixedMoney', standalone: true, pure: false })
export class FixedMoneyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly currency = inject(BusinessCurrencyStore);

  transform(value: Money | null | undefined, signed = false): string {
    return formatFixedMoney(value, this.locale, this.currency.symbol(), signed);
  }
}
