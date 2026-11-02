import type { CashCollection } from './point-money-move.model';
import type { ShiftClosure } from './shift-closure.model';

export interface CollectionReceipt {
  readonly kind: 'COLLECTION';
  readonly pointName: string;
  readonly collection: CashCollection;
}

export interface ShiftClosureReceipt {
  readonly kind: 'SHIFT_CLOSURE';
  readonly pointName: string;
  readonly closure: ShiftClosure;
}

export type FinanceReceipt = CollectionReceipt | ShiftClosureReceipt;
