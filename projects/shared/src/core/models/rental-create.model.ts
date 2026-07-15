import { Money } from './transaction.model';

export type BreakdownParams = Record<string, string | number> | null;

export interface RentalCostBreakdown {
  equipmentId?: number;
  equipmentType: string;
  tariffId: number;
  itemCost: Money;
  breakdownPatternCode?: string;
  params?: BreakdownParams;
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
