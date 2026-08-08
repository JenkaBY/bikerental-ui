import { Money } from './transaction.model';

export type RentalPriceMode = 'FULL' | 'DISCOUNT' | 'FIXED';

export interface RentalPricingDraft {
  mode: RentalPriceMode;
  discountPercent: number | null;
  specialPrice: number | null;
}

export type BreakdownParams = Record<string, string | number> | null;

export interface RentalCostBreakdown {
  equipmentId?: number;
  equipmentType: string;
  tariffId: number;
  itemCost: Money;
  breakdownPatternCode?: string;
  tariffCode?: string | null;
  pricingType?: string;
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
}
