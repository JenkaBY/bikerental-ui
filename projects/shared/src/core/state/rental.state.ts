import type { Money } from '@ui-models';
import type { Customer } from '@ui-models';
import type { EquipmentSearchItem } from '@ui-models';
import type { BrokenEquipmentEntry } from '@ui-models';

export interface RentalState {
  id: number | null;
  customer: Customer | null;
  equipmentItems: EquipmentSearchItem[];
  durationMinutes: number;
  discountPercent: number | undefined;
  specialPrice: number | undefined;
  specialPriceEnabled: boolean;
  isSaving: boolean;
  isActivating: boolean;
  isLoading: boolean;
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
