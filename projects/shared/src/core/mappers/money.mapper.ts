import { type Money } from '../models';

export function makeMoney(amount: number, currency = 'p.'): Money {
  return { amount, currency };
}
