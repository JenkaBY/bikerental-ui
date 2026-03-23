import { PricingParams, PricingType } from '../models';

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  equipmentType: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
  status: 'ACTIVE' | 'INACTIVE';
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
  calculationBreakdown: {
    breakdownPatternCode: string;
    message: string;
    params?: Record<string, unknown>;
  };
}
