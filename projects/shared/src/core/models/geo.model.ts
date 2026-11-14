export interface GeoCountry {
  readonly code: string;
  readonly name: string;
  readonly defaultTimeZone: string | null;
}

export interface GeoCity {
  readonly id: number;
  readonly name: string;
  readonly region: string | null;
  readonly timeZone: string | null;
  readonly suggestedTimeZone: string | null;
  readonly userEntered: boolean;
}

export interface GeoCountryTimeZone {
  readonly name: string;
  readonly defaultZone: boolean;
}

export interface GeoLocation {
  readonly id: number;
  readonly country: { readonly code: string; readonly name: string };
  readonly city: {
    readonly id: number;
    readonly name: string;
    readonly region: string | null;
    readonly userEntered: boolean;
  };
  readonly street: string | null;
}

export type GeoCityChoice = GeoCity | string;

export interface GeoLocationWrite {
  readonly countryCode: string;
  readonly city: GeoCityChoice;
  readonly street: string;
}

export const GEO_CITY_PAGE_SIZE = 20;
export const GEO_LOCATIONS_BATCH_MAX = 100;
