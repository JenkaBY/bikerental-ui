import type { PricingParams } from '@api-models';
import { EquipmentType } from './equipment-type.model';

export enum TariffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type PricingTypeSlug =
  | 'DEGRESSIVE_HOURLY'
  | 'FLAT_HOURLY'
  | 'DAILY'
  | 'FLAT_FEE'
  | 'SPECIAL';

export interface PricingType {
  slug: PricingTypeSlug;
  title: string;
  description: string;
}

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  equipmentType: EquipmentType;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
  status: TariffStatus;
  isActive: boolean;
  isSpecial: boolean;
}

export interface TariffWrite {
  name: string;
  description?: string;
  equipmentTypeSlug: string;
  pricingType: PricingTypeSlug;
  params: PricingParams;
  validFrom: Date;
  validTo?: Date;
}

export const FALLBACK_PRICING_TYPE: PricingType = {
  slug: 'DAILY',
  title: 'Call to developer!',
  description: 'Call to developer!',
};
