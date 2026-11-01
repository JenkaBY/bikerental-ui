import type { CashCollection } from './point-money-move.model';

export interface CollectionReceipt {
  readonly kind: 'COLLECTION';
  readonly pointName: string;
  readonly collection: CashCollection;
}

export type FinanceReceipt = CollectionReceipt;
