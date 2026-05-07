export interface RentalCostBreakdown {
  equipmentType: string;
  tariffId: number;
  itemCost: number;
}

export interface RentalCostEstimate {
  readonly subtotal: number;
  readonly totalCost: number;
  readonly discountAmount?: number;
  readonly discountPercent?: number;
  readonly specialPricingApplied: boolean;
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

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly typeSlug: string;
  readonly statusSlug: string;
}
