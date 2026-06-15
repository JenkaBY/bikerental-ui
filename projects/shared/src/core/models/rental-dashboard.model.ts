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
