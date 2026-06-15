import type { Money } from './transaction.model';
import type { RentalState } from './rental-create.model';
import type { EquipmentSearchItem } from './equipment.model';

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

export interface RentalDetailState extends RentalState {
  status: string;
  customerId: string;
  startedAt: Date | null;
  expectedReturnAt?: Date;
  paidDurationMinutes?: number;
  estimatedCost?: Money;
  finalCost?: Money;
  debtAmount?: Money;
  isActive: boolean;
  isDebt: boolean;
  isOverdue: boolean;
  overdueMinutes?: number;
  brokenEquipmentEntries: BrokenEquipmentEntry[];
  isReturning: boolean;
}
