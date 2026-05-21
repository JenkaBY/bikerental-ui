import { Money } from './transaction.model';
import type { Customer } from './customer.model';
import type { EquipmentSearchItem } from './equipment.model';

export interface RentalCostBreakdown {
  equipmentType: string;
  tariffId: number;
  itemCost: Money;
  calculationMessage: string;
}

export interface RentalCostEstimate {
  readonly subtotal: Money;
  readonly totalCost: Money;
  readonly discountAmount?: Money;
  readonly discountPercent?: number;
  readonly specialPricingApplied: boolean;
  readonly isEstimate: boolean;
  readonly equipmentBreakdowns: readonly RentalCostBreakdown[];
}

export interface RentalWrite {
  customerId: string;
  equipmentIds: number[];
  durationMinutes: number;
  discountPercent?: number;
  specialTariffId?: number;
  specialPrice?: number;
  operatorId: string;
}

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
