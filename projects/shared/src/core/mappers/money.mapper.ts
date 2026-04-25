import { type Money } from '../models';

export function makeMoney(amount: number, currency = 'BYN'): Money {
  return { amount, currency };
}
