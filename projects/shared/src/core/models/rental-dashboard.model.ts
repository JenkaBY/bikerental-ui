import type { EquipmentSearchItem } from './equipment.model';
import type { RentalCostBreakdown } from './rental-create.model';
import type { Money } from './transaction.model';

export interface RentalListItem {
  readonly id: number;
  readonly status: string;
  readonly customerPhone: string;
  readonly customerName?: string;
  readonly startedAt: Date;
  readonly equipmentNames: readonly string[];
  readonly expectedReturnAt?: Date;
  readonly isActive: boolean;
  readonly isDebt: boolean;
  readonly isOverdue: boolean;
  readonly overdueMinutes?: number;
}

export interface RentalEquipmentItem extends EquipmentSearchItem {
  readonly statusSlug: string;
  readonly isReturned: boolean;
  readonly estimatedCost: Money;
  readonly finalCost?: Money;
  readonly breakdown?: RentalCostBreakdown;
}

export interface BrokenEquipmentEntry {
  equipmentItemId: number;
  penaltyAmount?: number;
}

export interface ReturnEquipmentWrite {
  rentalId: number;
  equipmentItemIds: number[];
  discountPercent?: number;
  specialPrice?: number;
}

export type ReturnSettlementKind = 'refund' | 'collect' | 'none';

export interface ReturnSettlement {
  readonly kind: ReturnSettlementKind;
  readonly amount: Money;
}
