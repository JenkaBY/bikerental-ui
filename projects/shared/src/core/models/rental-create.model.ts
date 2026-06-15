import { Money } from './transaction.model';

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
