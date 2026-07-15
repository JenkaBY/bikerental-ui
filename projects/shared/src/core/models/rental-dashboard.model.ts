import type { EquipmentSearchItem } from './equipment.model';
import type { RentalCostBreakdown, RentalCostEstimate } from './rental-create.model';
import type { Money } from './transaction.model';

export interface RentalListEquipment {
  readonly uid?: string;
  readonly name: string;
}

export interface RentalListItem {
  readonly id: number;
  readonly status: string;
  readonly customerPhone: string;
  readonly customerName?: string;
  readonly startedAt: Date;
  readonly equipment: readonly RentalListEquipment[];
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
  readonly returnedAt?: Date;
  /** Set only when this item was added to the rental after the rental itself started. */
  readonly startedAt?: Date;
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

export interface RentalCostQuote {
  readonly quoteId: string;
  readonly quotedAt: Date;
  readonly expiresAt: Date;
  readonly estimate: RentalCostEstimate;
}
