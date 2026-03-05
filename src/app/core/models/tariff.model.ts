export type TariffStatus = 'ACTIVE' | 'INACTIVE';
export type TariffPeriod = 'HALF_HOUR' | 'HOUR' | 'DAY';

export interface TariffRequest {
  name: string;
  description?: string;
  equipmentTypeSlug?: string;
  basePrice: number;
  halfHourPrice: number;
  hourPrice: number;
  dayPrice: number;
  hourDiscountedPrice: number;
  validFrom: string;
  validTo?: string;
  status: TariffStatus;
}

export interface TariffResponse {
  id: number;
  name: string;
  description?: string;
  equipmentTypeSlug?: string;
  basePrice: number;
  halfHourPrice: number;
  hourPrice: number;
  dayPrice: number;
  hourDiscountedPrice: number;
  validFrom: string;
  validTo?: string;
  status: TariffStatus;
}

export interface TariffSelectionResponse {
  id: number;
  name: string;
  equipmentType: string;
  price: number;
  period: TariffPeriod;
}
