import { type Money } from '../models';

export function makeMoney(amount: number, currency = ''): Money {
  return { amount, currency };
}
