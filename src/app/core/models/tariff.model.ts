export type TariffStatus = 'ACTIVE' | 'INACTIVE';

export interface BreakdownCostDetails {
  breakdownPatternCode: string;
  message: string;
  params?: Record<string, unknown>;
}

export interface TariffSelectionResponse {
  tariff: TariffV2Response;
  totalCost: number;
  calculationBreakdown: BreakdownCostDetails;
}

// --- v2 API types (added for TASK015) -------------------------------
export type PricingType = 'DEGRESSIVE_HOURLY' | 'FLAT_HOURLY' | 'DAILY' | 'FLAT_FEE' | 'SPECIAL';

export interface PricingParams {
  // DEGRESSIVE_HOURLY
  firstHourPrice?: number;
  hourlyDiscount?: number;
  minimumHourlyPrice?: number;

  // FLAT_HOURLY
  hourlyPrice?: number;

  // DAILY
  dailyPrice?: number;
  overtimeHourlyPrice?: number;

  // FLAT_FEE
  issuanceFee?: number;
  minimumDurationMinutes?: number;
  minimumDurationSurcharge?: number;

  // SPECIAL: no params
  [key: string]: number | undefined;
}

export interface TariffV2Request {
  name: string;
  description?: string;
  equipmentTypeSlug: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: string; // ISO date (YYYY-MM-DD)
  validTo?: string;
}

export interface TariffV2Response {
  id: number;
  name: string;
  description?: string;
  equipmentType: string;
  pricingType: PricingType;
  params: PricingParams;
  validFrom: string;
  validTo?: string;
  version?: string;
  status: TariffStatus;
}

export interface PricingTypeResponse {
  slug: string;
  title: string;
  description?: string;
}
