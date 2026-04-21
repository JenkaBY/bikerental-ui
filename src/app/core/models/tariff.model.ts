import type { BreakdownCostDetails, PricingParams } from '@api-models';

export type TariffStatus = 'ACTIVE' | 'INACTIVE';
export type PricingType = 'DEGRESSIVE_HOURLY' | 'FLAT_HOURLY' | 'DAILY' | 'FLAT_FEE' | 'SPECIAL';

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  equipmentType: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
  status: TariffStatus;
}

export interface TariffWrite {
  name: string;
  description?: string;
  equipmentTypeSlug: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
}

export interface TariffSelection {
  tariff: Tariff;
  totalCost: number;
  calculationBreakdown: BreakdownCostDetails;
}
